import os
from pathlib import Path
import tiktoken
from anthropic import Anthropic
from dotenv import load_dotenv

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

    # Resolve the directory to an absolute path
    directory = directory.resolve()
    print(f"Analyzing files in {directory.relative_to(PROJECT_ROOT)}...")

    def traverse(current_dir):
        nonlocal total_size, codebase
        try:
            for entry in current_dir.iterdir():
                # Skip if this is an ignored directory (and all its contents)
                if entry.is_dir() and entry.name in ignore_dirs:
                    print(f"Skipping directory and its contents: {entry.relative_to(PROJECT_ROOT)}")
                    continue

                if entry.is_dir():
                    traverse(entry)  # Recurse into subdirectory
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
    doc_files = ['BIBLE.md', 'APP_DOCS.md']  # Add paths to additional docs if needed
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

def build_prompt():
    # Gather codebase from ./frontend and ./backend
    frontend_content = read_codebase(PROJECT_ROOT / 'frontend')
    backend_content = read_codebase(PROJECT_ROOT / 'backend')
    docs_content = read_docs()

    codebase = f"{frontend_content}{backend_content}{docs_content}"
    prompt_text = f"""
You are an expert full-stack developer and code auditor with deep knowledge of React (JS/JSX), Express.js, and MongoDB. The codebase below is a ~10k-line MVP called GitStatus, which analyzes GitHub commit history to generate AI-powered reports. I’ve made significant changes, including removing hardcoded API keys, adding PDF watermarking, and separating concerns into smaller, single-duty units. Note: The app is likely broken and won’t deploy due to untested changes, but the code is cleaner and more modular. I’ve included the current Claude Bible (`BIBLE.md`), app docs (`APP_DOCS.md`), and additional documentation for reference. This is a sample run to calibrate token usage—summarize the codebase structure and estimate its size in lines.

---

{codebase}

---

### Instructions
- Summarize the codebase structure (e.g., key directories, file types).
- Estimate the total lines of code (excluding comments and blank lines if possible).
- Note: This is a sample run to calibrate token usage—keep the response concise.
"""
    return prompt_text

def calibrate_tokens():
    # Build the full prompt
    prompt = build_prompt()
    with open('full_prompt.txt', 'w', encoding='utf-8') as f:
        f.write(prompt)
    print("Full prompt saved to full_prompt.txt")

    # Estimate tokens with tiktoken
    tiktoken_tokens = len(encoding.encode(prompt))
    tiktoken_fudged_tokens = int(tiktoken_tokens * 1.25)
    print(f"Tiktoken estimated tokens: {tiktoken_tokens:,}")
    print(f"Tiktoken fudged tokens (25% increase): {tiktoken_fudged_tokens:,}")

    # Extract a ~1000-token sample (per tiktoken)
    target_sample_tokens = 1000
    sample_text = ""
    current_tokens = 0
    for line in prompt.splitlines(keepends=True):
        sample_text += line
        current_tokens = len(encoding.encode(sample_text))
        if current_tokens >= target_sample_tokens:
            break
    sample_tokens = len(encoding.encode(sample_text))
    print(f"Sample size (tiktoken): {sample_tokens} tokens")

    # Send the sample to Anthropic with thinking mode
    print("Sending sample to Claude 3.7 Sonnet with thinking mode...")
    anthropic_input_tokens = 0
    anthropic_output_tokens = 0
    try:
        response = anthropic.messages.create(
            model="claude-3-7-sonnet-20250219",
            messages=[{"role": "user", "content": sample_text}],
            max_tokens=2048,  # Set max_tokens to 2048
            thinking={"type": "enabled", "budget_tokens": 1024}  # Thinking budget of 1024
        )
        anthropic_input_tokens = response.usage.input_tokens
        anthropic_output_tokens = response.usage.output_tokens
        print(f"Anthropic reported input tokens: {anthropic_input_tokens}")
        print(f"Anthropic reported output tokens: {anthropic_output_tokens}")
    except Exception as e:
        print(f"Error sending sample: {e}")
        return

    # Calibrate token estimation
    tiktoken_to_anthropic_ratio = anthropic_input_tokens / sample_tokens
    print(f"Tiktoken to Anthropic ratio: {tiktoken_to_anthropic_ratio:.2f}")

    # Adjust full prompt estimate
    adjusted_tokens = int(tiktoken_tokens * tiktoken_to_anthropic_ratio)
    print(f"Adjusted full prompt tokens (based on Anthropic ratio): {adjusted_tokens:,}")

if __name__ == "__main__":
    try:
        calibrate_tokens()
        print("Calibration done!")
    except Exception as e:
        print(f"Error: {e}")