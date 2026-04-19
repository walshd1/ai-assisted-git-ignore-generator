const core = require('@actions/core');
const fs = require('fs');
const PROMPT = `You are an expert .gitignore file generator. Your task is to create a comprehensive and accurate .gitignore file based on the provided project information.

**Project Information:**

*   **Programming Languages:** {programming_languages}
*   **Frameworks/Libraries:** {frameworks_libraries}
*   **Operating System(s):** {operating_systems} (If known, otherwise assume cross-platform compatibility)
*   **IDE(s)/Editor(s) Used:** {ides_editors} (If known, otherwise assume common IDEs like VS Code, IntelliJ, etc.)
*   **Package Managers:** {package_managers} (e.g., npm, pip, Maven, Gradle)
*   **Cloud Platforms (if applicable):** {cloud_platforms} (e.g., AWS, Azure, GCP)
*   **Database(s) (if applicable):** {databases}

**Instructions:**

1.  Analyze the provided project information to identify common files and directories that should be excluded from version control (Git).
2.  Include entries for:
    *   Compiler output files (e.g., '.o', '.class', '.exe')
    *   Temporary files created by IDEs/editors (e.g., '.idea', '.vscode', '*.swp')
    *   Package manager dependencies (e.g., 'node_modules', 'venv', 'target')
    *   Log files
    *   Configuration files containing sensitive information (e.g., API keys, passwords) - be generic and avoid suggesting specific filenames unless the framework dictates a standard.
    *   Operating system specific files (e.g., '.DS_Store', 'Thumbs.db')
    *   Cloud platform specific files (e.g., credentials files)
    *   Database specific files (e.g., local database files)
3.  Organize the '.gitignore' entries into logical sections (e.g., # IDE, # OS, # Dependencies, # Logs).
4.  Add comments to explain the purpose of each section.
5.  Prioritize security and avoid committing sensitive information.
6.  Ensure the generated '.gitignore' file is compatible with common Git clients and platforms.
7.  Output ONLY the content of the '.gitignore' file. Do not include any introductory text or explanations outside of the comments within the '.g`;
async function run() {
  try {
    const key = core.getInput('gemini_api_key');
    const token = core.getInput('service_token');
    const ctx = { repoName: process.env.GITHUB_REPOSITORY || '', event: process.env.GITHUB_EVENT_NAME || '' };
    try { Object.assign(ctx, JSON.parse(fs.readFileSync('package.json', 'utf8'))); } catch {}
    let prompt = PROMPT;
    for (const [k, v] of Object.entries(ctx)) prompt = prompt.replace(new RegExp('{' + k + '}', 'g'), String(v || ''));
    let result;
    if (key) {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 2000 } })
      });
      result = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (token) {
      const r = await fetch('https://action-factory.walshd1.workers.dev/generate/ai-assisted-git-ignore-generator', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(ctx)
      });
      result = (await r.json()).content || '';
    } else throw new Error('Need gemini_api_key or service_token');
    console.log(result);
    core.setOutput('result', result);
  } catch (e) { core.setFailed(e.message); }
}
run();
