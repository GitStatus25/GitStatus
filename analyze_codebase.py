import os
from pathlib import Path
import tiktoken
from anthropic import Anthropic
from dotenv import load_dotenv
import time

# Load environment variables from .env
load_dotenv()
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
if not anthropic_api_key:
    raise ValueError("ANTHROPIC_API_KEY not found in .env file")

# Initialize Anthropic client
anthropic = Anthropic(api_key=anthropic_api_key)

# Initialize tiktoken with cl100k_base encoding (closest to Claude 3.7 Sonnet)
encoding = tiktoken.get_encoding("cl100k_base")

# Get the project root directory (where the script is located)
PROJECT_ROOT = Path(__file__).parent.resolve()

def read_codebase(directory, max_size_mb=5):
    ignore_dirs = {'node_modules', 'dist', 'build', '.git', 'coverage', '.next', '.cache'}
    codebase = []
    total_size = 0

    directory = directory.resolve()
    print(f"Analyzing files in {directory.relative_to(PROJECT_ROOT)}...")

    def traverse(current_dir):
        nonlocal total_size, codebase
        try:
            for entry in current_dir.iterdir():
                if entry.is_dir() and entry.name in ignore_dirs:
                    print(f"Skipping directory and its contents: {entry.relative_to(PROJECT_ROOT)}")
                    continue

                if entry.is_dir():
                    traverse(entry)
                    continue

                if (entry.suffix in {'.js', '.jsx', '.md', '.css'} or 
                    entry.name == 'package.json' and 'package-lock.json' not in entry.name):
                    try:
                        stats = entry.stat()
                        size_mb = stats.st_size / (1024 * 1024)
                        if total_size + size_mb > max_size_mb:
                            print(f"Skipping {entry.relative_to(PROJECT_ROOT)} - exceeds {max_size_mb}MB limit")
                            continue

                        content = entry.read_text(encoding='utf-8')
                        relative_path = entry.relative_to(PROJECT_ROOT)
                        codebase.append(f"---\nFile: {relative_path}\n---\n{content}\n\n")
                        total_size += size_mb
                    except Exception as e:
                        print(f"Error reading {entry}: {e}")
        except Exception as e:
            print(f"Error traversing {current_dir}: {e}")

    traverse(directory)
    print(f"Total size in {directory}: {total_size:.2f} MB")
    return "".join(codebase)

def read_docs():
    doc_files = ['BIBLE.md', 'APP_DOCS.md']
    docs_content = []
    total_size = 0
    for doc_file in doc_files:
        try:
            file_path = PROJECT_ROOT / doc_file
            content = file_path.read_text(encoding='utf-8')
            stats = file_path.stat()
            size_mb = stats.st_size / (1024 * 1024)
            total_size += size_mb
            docs_content.append(f"---\nFile: {doc_file}\n---\n{content}\n\n")
            print(f"Read {doc_file}: {size_mb:.2f} MB")
        except Exception as e:
            print(f"Could not read {doc_file}: {e}")
    print(f"Total size of docs: {total_size:.2f} MB")
    return "".join(docs_content)

def build_codebase_content():
    frontend_content = read_codebase(PROJECT_ROOT / 'frontend')
    backend_content = read_codebase(PROJECT_ROOT / 'backend')
    docs_content = read_docs()
    return f"{frontend_content}{backend_content}{docs_content}"

def chunk_codebase(codebase, chunk_size=14250):
    tokens = encoding.encode(codebase)
    chunks = []
    current_chunk = []
    current_tokens = 0

    for token in tokens:
        current_chunk.append(token)
        current_tokens += 1
        if current_tokens >= chunk_size:
            chunks.append(encoding.decode(current_chunk))
            current_chunk = []
            current_tokens = 0

    if current_chunk:
        chunks.append(encoding.decode(current_chunk))

    return chunks

def cache_codebase():
    codebase = build_codebase_content()
    total_tokens = len(encoding.encode(codebase))
    print(f"Total codebase tokens (Tiktoken): {total_tokens:,}")
    print(f"Fudged tokens (1.4 ratio): {int(total_tokens * 1.4):,}")

    chunks = chunk_codebase(codebase, chunk_size=14250)
    print(f"Split codebase into {len(chunks)} chunks of ~14,250 Tiktoken tokens each")

    for i, chunk in enumerate(chunks):
        chunk_tokens = len(encoding.encode(chunk))
        print(f"Caching chunk {i + 1}/{len(chunks)} with {chunk_tokens} Tiktoken tokens...")
        try:
            anthropic.messages.create(
                model="claude-3-7-sonnet-20250219",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": chunk,
                                "cache_control": {"type": "ephemeral"}
                            }
                        ]
                    }
                ],
                max_tokens=0  # No response, just caching
            )
            print(f"Chunk {i + 1} cached successfully")
        except Exception as e:
            print(f"Error caching chunk {i + 1}: {e}")
            return

        if i < len(chunks) - 1:  # Don't sleep after the last chunk
            print("Waiting 60 seconds before sending the next chunk...")
            time.sleep(60)

    return codebase

def analyze_codebase():
    # Cache the codebase
    codebase = cache_codebase()
    if not codebase:
        print("Failed to cache codebase, exiting.")
        return

    # System prompt (role)
    system_prompt = """
You are an expert full-stack developer and code auditor with deep knowledge of React (JS/JSX), Express.js, and MongoDB, tasked with analyzing GitStatus, a ~10k-line MVP that generates AI-powered reports from GitHub commit history.
"""

    # Instructions (updated but will iterate further)
    instructions = """
### Context
The codebase has undergone recent changes, including removing hardcoded API keys, adding PDF watermarking, and separating concerns into smaller, single-duty units. The app is likely broken and won’t deploy due to untested changes, but the code is cleaner and more modular. It includes the current Claude Bible (`BIBLE.md`), app docs (`APP_DOCS.md`), and additional documentation for reference.

---

[Codebase already cached]

---

### Instructions
Use extended thinking mode with an 8,000-token thinking budget to reason step-by-step, breaking down your analysis into detailed steps for each section. Think deeply about stability, scalability (e.g., 10x users), and long-term maintainability, considering edge cases, performance under load, and potential tech debt from recent fixes.

1. **Documentation Gaps**:
   - List missing or vague info in `.md` files, especially `roadmap.md` (file, note).
   - Suggest specific additions (e.g., code snippets, examples) to make docs more actionable.
   - Think: How can docs better support scalability and onboarding? What gaps might hinder future AI analysis?

2. **Roadmap Progress**:
   - Parse `roadmap.md` Phase 1 tasks—list what’s undone (file/line or "not found") and future tasks done (file/line).
   - Analyze how recent fixes (e.g., PDF watermarking, modular refactors) impact roadmap progress.
   - Think: Are there new blockers for Phase 1? How can undone tasks be prioritized? What edge cases might affect completion?

3. **Code Issues**:
   - Scan `.js`, `.jsx`, `.md`, `.css`, `package.json` for bugs, security flaws, duplication, unused code, bad naming, wrong structure, bad practices, fragility (file, line, severity, fix).
   - Re-evaluate security post-fixes (e.g., environment variable mismanagement, new vulnerabilities from refactors).
   - Analyze edge cases (e.g., GitHub API rate limits, large commit histories, report generation failures, race conditions in async PDF generation).
   - Think: What new issues might my fixes have introduced? How can I prevent future bugs? What are the security implications of my modular structure?

4. **Digestibility Refactors**:
   - Validate my recent separation of concerns—suggest further splits for React components, Express routes, MongoDB queries into small, single-duty units (file, line, new structure, matching frontend-backend fixes).
   - Provide pseudocode or snippets for key refactors (e.g., pagination in `services/github.js`, async PDF generation in `services/pdf.js`).
   - Think: How can I make the codebase even more modular for AI analysis? Are there diminishing returns to my separation of concerns?

5. **Technical Debt**:
   - Refactor for stability—focus on:
     - **PDF Generation** (`services/pdf.js`): Design an asynchronous architecture with a job queue (e.g., Bull/Redis), including error handling, user feedback (e.g., status updates), and edge cases (e.g., queue failures, large PDFs).
     - **MongoDB** (`server.js`, `models/Report.js`): Analyze query performance, suggest specific indexes (e.g., compound indexes), design a robust connection strategy with pooling, retries, and error handling.
     - **State Management** (`frontend/src/contexts/ModalContext.js`): Compare Redux vs. Zustand vs. Context for modal complexity—list pros/cons, recommend one, and provide a migration plan.
   - Think: How will these changes impact scalability? What edge cases should I consider (e.g., 100 concurrent report generations)? How can I future-proof the architecture?

6. **Claude Bible & App Docs (Post-Fix)**:
   - **Claude Bible**: Refine the existing Bible (`BIBLE.md`)—preserve good rules, but make them cleaner, more concise, and more actionable. Infer additional rules from fixes and codebase patterns (e.g., component size, route structure, query design)—no arbitrary rules. Include: "Claude must update APP_DOCS.md after every change."
   - **App Docs**: Update the existing app docs (`APP_DOCS.md`) to reflect the app *after all fixes*:
     - Overview: App purpose, structure.
     - Frontend: Key React components (file, duty, props/hooks).
     - Backend: Express routes (path, method, purpose), MongoDB schemas/queries (model, use).
     - Connections: Frontend-backend data flow (e.g., API calls from React to Express).
   - Think: How can the Bible ensure long-term consistency across iterations? How can app docs reflect my new modular structure while remaining concise?

### Output Format
Markdown:
- `## Documentation Gaps`
- `## Roadmap Progress` (`### Phase 1 Remaining`, `### Future Phases Done`)
- `## Code Issues` (subsections)
- `## Digestibility Refactors`
- `## Technical Debt`
- `## Claude Bible`
- `## Application Docs`

### Rules
- Be detailed—include thinking blocks for each section, breaking down your reasoning step-by-step with an 8,000-token thinking budget.
- Provide pseudocode or snippets for key fixes and refactors.
- Analyze edge cases and future-proofing (e.g., scalability, performance under load).
- Cite file/line for all issues.
- Skip "looks good"—focus on issues/gaps.
- Assume Node.js v18+, React 18, Express 4.x, MongoDB 6+.
- Digestibility: Small, clear units for AI.
- Bible: Refine existing rules, preserve good ones, make them concise and actionable, include "keep APP_DOCS.md updated."
- Docs: Update `APP_DOCS.md` to reflect fixes, note frontend-backend connections, reference other docs as needed but do not recreate them.
"""

    # Final analysis prompt
    print("Sending final analysis prompt...")
    try:
        response = anthropic.messages.create(
            model="claude-3-7-sonnet-20250219",
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": codebase,
                            "cache_control": {"type": "ephemeral"}
                        },
                        {
                            "type": "text",
                            "text": instructions
                        }
                    ]
                }
            ],
            max_tokens=16000,  # 8k core response + 8k thinking
            thinking={"type": "enabled", "budget_tokens": 8000}
        )
        print("Analysis complete! Writing response to output.md...")
        with open('output.md', 'w', encoding='utf-8') as f:
            f.write(response.content[0].text)
        print(f"Output tokens: {response.usage.output_tokens}")
    except Exception as e:
        print(f"Error during analysis: {e}")

if __name__ == "__main__":
    try:
        analyze_codebase()
        print("Analysis done!")
    except Exception as e:
        print(f"Error: {e}")