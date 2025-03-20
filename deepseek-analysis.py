import os
from openai import OpenAI
import tiktoken
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
api_key = os.getenv("DEEPSEEK_API_KEY")
if not api_key:
    raise ValueError("DEEPSEEK_API_KEY not found in .env file")

# Initialize OpenAI client
client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

# Configuration
input_token_limit = 64000  # R3's input token limit
valid_sections = ["code_review", "readme", "rules", "docs"]
output_sections = ["code_review", "rules"]  # Set to "docs", "readme", or "rules" for other runs

# Validate the selected section
for output_section in output_sections:
    if output_section not in valid_sections:
        raise ValueError(f"Invalid section: {output_section}. Choose from {valid_sections}")

# Function to estimate tokens
def estimate_tokens(text):
    encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))

# Replace with your actual codebase content
frontend_content = ""
for root, dirs, files in os.walk("frontend"):
    # Skip hidden folders, node_modules, etc
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'venv', 'output']]
    
    for file in files:
        if file.endswith(('.js', '.jsx', '.css')):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                frontend_content += f"--- file start: {file_path} ---\n"
                frontend_content += f.read()
                frontend_content += "\n--- file end ---\n\n"

backend_content = ""
for root, dirs, files in os.walk("backend"):
    # Skip hidden folders, node_modules, etc
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'venv', 'output']]
    
    for file in files:
        if file.endswith(('.js')):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                backend_content += f"--- file start: {file_path} ---\n"
                backend_content += f.read()
                backend_content += "\n--- file end ---\n\n"

# System prompt tailored to the selected section
tech_stack = {
    "frontend": {
        "framework": "React",
        "ui_library": "Material UI"
    },
    "backend": {
        "framework": "Express.js",
        "database": "MongoDB",
        "queue": {
            "service": "Redis",
            "library": "Bull"
        }
    },
    "deployment": {
        "cloud": "AWS"
    }
}

system_prompt = (
    f"You are an expert full stack developer and architect specializing in "
    f"{tech_stack['frontend']['framework']}, {tech_stack['backend']['framework']}, "
    f"{tech_stack['backend']['database']}, {tech_stack['backend']['queue']['service']}/"
    f"{tech_stack['backend']['queue']['library']}, and {tech_stack['deployment']['cloud']} deployment. "
    f"Analyze the provided codebase, and provide the following section(s): {output_sections}"
)

# Instructions for each section
section_instructions = {
    "code_review": "Provide a detailed code review with suggestions for fixing technical issues, formatted as 'File: <path> - Line: <number> - Suggestion: <description>'.",
    "readme": "Create a concise README for developer onboarding, including project description, setup, and usage examples.",
    "rules": "Define rules for an AI assistant to follow when working on this codebase.",
    "docs": "Generate complete application documentation, covering architecture and key components."
}

instructions = f"Analyze the codebase and provide the following section(s):\n\n" + \
               "\n\n".join([f"{section.replace('_', ' ').title()}: {section_instructions[section]}" 
                           for section in output_sections])

# Frontend then backend
for code_content, location in [(frontend_content, "frontend"), (backend_content, "backend")]:
    # Estimate input tokens
    total_tokens = estimate_tokens(code_content + system_prompt + instructions)
    if total_tokens > input_token_limit:
        print(f"Error: Input tokens ({total_tokens}) exceed limit of {input_token_limit}. Split the codebase.")
        break
    # ask if we should continue with these tokens
    print(f"Code content: {code_content}")
    print(f"System prompt: {system_prompt}")
    print(f"Instructions: {instructions}")
    print(f"Total tokens: {total_tokens}")
    print(f"Input token limit: {input_token_limit}")
    # wait for input
    input("Press Enter to continue...")
    # Generate the selected section
    try:
        response = client.chat.completions.create(
            model="deepseek-reasoner",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": instructions + "\n\nCodebase:\n" + code_content},
            ],
            max_tokens=8000,  # Use full output limit for this section
            stream=True,
        )
        output_file = f"{location}_report.md"
        print(f"\nGenerating {location} report...")
        with open(output_file, "w", encoding="utf-8") as f:
            for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    f.write(content)
                if chunk.choices[0].delta.reasoning_content:
                    content = chunk.choices[0].delta.reasoning_content
                    print(content, end="", flush=True)
        print(f"\nReport saved to {output_file}")
    except Exception as e:
        print(f"API request failed: {e}")