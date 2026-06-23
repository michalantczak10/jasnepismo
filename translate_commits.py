#!/usr/bin/env python3

import subprocess
import re

# Polish to English translation mapping for commit messages
polish_to_english = {
    # Contact section related
    "Usuń zegarek i strzałki z sekcji kontakt": "Remove watch and arrows from contact section",
    "dodaj ikonke zegara miedzy tekstem a przyciskiem": "Add watch icon between text and button",
    "usun strzalke z przycisku kontakt": "Remove arrow from contact button",
    "popraw pozycjonowanie elementow w sekcji kontakt": "Fix positioning of elements in contact section",
    "usuń różowe kółko i uprość sekcję kontakt": "Remove pink circle and simplify contact section",
    "uatrakcyjnij wyglad sekcji kontakt": "Enhance contact section appearance",
    "Wypchnij wszystkie dotychczasowe zmiany": "Push all changes so far",
    
    # Layout and styling
    "wyśrodkuj kopertę poprawnie": "Center envelope correctly",
    "wyśrodkuj kopertę": "Center envelope",
    
    # Other Polish commits (I'll add more as needed)
    "Zwiększono rozmiar emoji w CTA i dodano cache-bust ?v=13 dla styles.css": "Increase CTA emoji size and add cache-bust for styles.css",
    "Dostosowano wygląd przycisków na stronie głównej: większe pigułki i silniejsze cienie (desktop i mobile)": "Adjust homepage button appearance: larger pills and stronger shadows (desktop and mobile)",
    "Wymuszenie mobile-stylu CTA w stopce (użycie !important) — nadpisanie inline width/skryptów": "Force mobile CTA style in footer (using !important) — override inline width/scripts",
    "Dostosowano wygląd przycisków stopki i CTA na małych ekranach (styling mobilny)": "Adjust footer button appearance and CTA on small screens (mobile styling)",
    "Prefer CSS button width when applying inline widths (button-fit)": "Prefer CSS button width when applying inline widths (button-fit)",
    "Zwiększono szerokość przycisków: --control-width 420px": "Increase button width: --control-width 420px",
    "Ujednolicenie stylu stron legalnych: zwiększono szerokość treści, wyrównano typografię": "Unify legal page styles: increase content width, align typography",
    "Ujednolicono komunikat 'odpowiadamy w 48h' — pojedynczy, wyróżniony komunikat w stopce": "Unify 'reply in 48h' message — single, highlighted message in footer",
    "Zwiększono poziome marginesy stopki (global): .site-footer padding 32px": "Increase footer horizontal margins (global): .site-footer padding 32px",
    "Zwiększono marginesy boczne stopki: większy padding (.site-footer, .footer-inner) i zwiększone boczne marginesy": "Increase footer side margins: larger padding (.site-footer, .footer-inner) and increased side margins",
    "fix(buttons): center icon+label as a group; use inline-labels to avoid offset": "fix(buttons): center icon+label as a group; use inline-labels to avoid offset",
    "fix(buttons): make labels single-line without truncation; adjust spacing": "fix(buttons): make labels single-line without truncation; adjust spacing",
    "fix(buttons): avoid truncation by global sizing and wrap fallback": "fix(buttons): avoid truncation by global sizing and wrap fallback",
    "fix(buttons): unify label sizes across buttons and tighten icon gap": "fix(buttons): unify label sizes across buttons and tighten icon gap",
    "fix(buttons): reduce icon-label gaps and unify label sizes": "fix(buttons): reduce icon-label gaps and unify label sizes",
    "fix(buttons): wrap labels and prefer label shrink (avoid wrapping)": "fix(buttons): wrap labels and prefer label shrink (avoid wrapping)",
    "fix(buttons): auto-shrink button text to single line": "fix(buttons): auto-shrink button text to single line",
    "fix(responsive): improve grid and CTA behavior on tablet/mobile": "fix(responsive): improve grid and CTA behavior on tablet/mobile",
    "chore: update sitemap [skip ci]": "chore: update sitemap [skip ci]",
    "chore: bump CSS cache version": "chore: bump CSS cache version",
    "chore: bump styles.css version to v=16": "chore: bump styles.css version to v=16",
    "chore: trigger Vercel redeploy": "chore: trigger Vercel redeploy",
    "fix(css): close block in styles.css": "fix(css): close block in styles.css",
    "chore: bump styles.css version to v=15 (purge)": "chore: bump styles.css version to v=15 (purge)",
    "chore: bump styles.css version to v=14": "chore: bump styles.css version to v=14",
    "ui: main CTA cta-warm": "ui: main CTA cta-warm",
    "e2e: assert exact hero heading text": "e2e: assert exact hero heading text",
    "E2E: make hero heading assertion accept updated copy (support old and new variants)": "E2E: make hero heading assertion accept updated copy (support old and new variants)",
    "Zwiększono rozmiar emoji w CTA i dodano cache-bust ?v=13 dla styles.css": "Increase CTA emoji size and add cache-bust for styles.css",
    "chore: update sitemap [skip ci]": "chore: update sitemap [skip ci]",
    "chore: bump CSS cache version": "chore: bump CSS cache version",
    
    # Add more translations as needed...
}

def translate_commit_message(message):
    """Translate a commit message from Polish to English"""
    # Check if the message is in our translation map
    if message in polish_to_english:
        return polish_to_english[message]
    
    # Try to find a partial match
    for polish, english in polish_to_english.items():
        if polish in message:
            return english
    
    # If no match found, return the original message
    return message

def get_all_commits():
    """Get all commit hashes and messages"""
    result = subprocess.run(
        ["git", "log", "--all", "--pretty=format:%H %s"],
        capture_output=True,
        text=True
    )
    commits = []
    for line in result.stdout.strip().split('\n'):
        if line:
            parts = line.split(' ', 1)
            if len(parts) == 2:
                commits.append((parts[0], parts[1]))
    return commits

def update_commit_messages():
    """Update all commit messages to English"""
    commits = get_all_commits()
    
    print(f"Found {len(commits)} commits to process")
    
    # Create a temporary file for the filter-repo script
    with open('filter-commits.py', 'w') as f:
        f.write("""
import sys
import subprocess

# Polish to English translation mapping
polish_to_english = {
""")
        # Add the translation mapping to the script
        for polish, english in polish_to_english.items():
            f.write(f'    "{polish}": "{english}",\n')
        
        f.write("""
}

def translate_commit_message(message):
    """Translate a commit message from Polish to English"""
    if message in polish_to_english:
        return polish_to_english[message]
    
    for polish, english in polish_to_english.items():
        if polish in message:
            return english
    
    return message

# Read the commit hashes from stdin
commit_hashes = [line.strip() for line in sys.stdin if line.strip()]

for commit_hash in commit_hashes:
    # Get the current commit message
    result = subprocess.run(
        ["git", "log", "-1", "--pretty=format:%s", commit_hash],
        capture_output=True,
        text=True
    )
    current_message = result.stdout.strip()
    
    # Translate the commit message
    new_message = translate_commit_message(current_message)
    
    if current_message != new_message:
        print(f"Updating commit {commit_hash[:8]}: {current_message} -> {new_message}")
        # Use git commit --amend to update the commit message
        subprocess.run(
            ["git", "commit", "--amend", "--no-edit", "-m", new_message],
            cwd="."
        )
    else:
        print(f"No change needed for commit {commit_hash[:8]}: {current_message}")
""")
    
    # Get all commit hashes
    print("Getting all commit hashes...")
    result = subprocess.run(
        ["git", "log", "--all", "--pretty=format:%H"],
        capture_output=True,
        text=True
    )
    commit_hashes = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
    
    # Write commit hashes to a file
    with open('commit-hashes.txt', 'w') as f:
        for commit_hash in commit_hashes:
            f.write(f"{commit_hash}\n")
    
    # Run the script to update commit messages
    print("Updating commit messages...")
    with open('commit-hashes.txt', 'r') as f:
        subprocess.run(
            ["python", "filter-commits.py"],
            stdin=f,
            check=True
        )
    
    # Clean up temporary files
    import os
    os.remove('filter-commits.py')
    os.remove('commit-hashes.txt')
    
    print("Done!")

if __name__ == "__main__":
    update_commit_messages()
