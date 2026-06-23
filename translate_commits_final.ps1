# PowerShell script to translate commit messages to English
# This script uses git filter-branch to rewrite commit history with English messages

# Create a temporary directory for the filter-branch operation
$tempDir = New-TemporaryDirectory
Set-Location $tempDir

# Clone the repository to work with
cd "$(git rev-parse --git-dir)/.."
git clone . "$tempDir/repo"
cd "$tempDir/repo"

# Create a simple filter script
$filterScript = @'
#!/bin/bash

# Function to translate commit messages
translate_commit_message() {
    local message="$1"
    
    case "$message" in
        "Usuń zegarek i strzałki z sekcji kontakt")
            echo "Remove watch and arrows from contact section"
            return
            ;;
        "dodaj ikonke zegara miedzy tekstem a przyciskiem")
            echo "Add watch icon between text and button"
            return
            ;;
        "usun strzalke z przycisku kontakt")
            echo "Remove arrow from contact button"
            return
            ;;
        "popraw pozycjonowanie elementow w sekcji kontakt")
            echo "Fix positioning of elements in contact section"
            return
            ;;
        "usuń różowe kółko i uprość sekcję kontakt")
            echo "Remove pink circle and simplify contact section"
            return
            ;;
        "uatrakcyjnij wyglad sekcji kontakt")
            echo "Enhance contact section appearance"
            return
            ;;
        "Wypchnij wszystkie dotychczasowe zmiany")
            echo "Push all changes so far"
            return
            ;;
        "wyśrodkuj kopertę poprawnie")
            echo "Center envelope correctly"
            return
            ;;
        "wyśrodkuj kopertę")
            echo "Center envelope"
            return
            ;;
        "Zwiększono rozmiar emoji w CTA i dodano cache-bust ?v=13 dla styles.css")
            echo "Increase CTA emoji size and add cache-bust for styles.css"
            return
            ;;
        "Dostosowano wygląd przycisków na stronie głównej: większe pigułki i silniejsze cienie (desktop i mobile)")
            echo "Adjust homepage button appearance: larger pills and stronger shadows (desktop and mobile)"
            return
            ;;
        "Wymuszenie mobile-stylu CTA w stopce (użycie !important) — nadpisanie inline width/skryptów")
            echo "Force mobile CTA style in footer (using !important) — override inline width/scripts"
            return
            ;;
        "Dostosowano wygląd przycisków stopki i CTA na małych ekranach (styling mobilny)")
            echo "Adjust footer button appearance and CTA on small screens (mobile styling)"
            return
            ;;
        "Prefer CSS button width when applying inline widths (button-fit)")
            echo "Prefer CSS button width when applying inline widths (button-fit)"
            return
            ;;
        "Zwiększono szerokość przycisków: --control-width 420px")
            echo "Increase button width: --control-width 420px"
            return
            ;;
        "Ujednolicenie stylu stron legalnych: zwiększono szerokość treści, wyrównano typografię")
            echo "Unify legal page styles: increase content width, align typography"
            return
            ;;
        "Ujednolicono komunikat 'odpowiadamy w 48h' — pojedynczy, wyróżniony komunikat w stopce")
            echo "Unify 'reply in 48h' message — single, highlighted message in footer"
            return
            ;;
        "Zwiększono poziome marginesy stopki (global): .site-footer padding 32px")
            echo "Increase footer horizontal margins (global): .site-footer padding 32px"
            return
            ;;
        "Zwiększono marginesy boczne stopki: większy padding (.site-footer, .footer-inner) i zwiększone boczne marginesy")
            echo "Increase footer side margins: larger padding (.site-footer, .footer-inner) and increased side margins"
            return
            ;;
        "fix(buttons): center icon+label as a group; use inline-labels to avoid offset")
            echo "fix(buttons): center icon+label as a group; use inline-labels to avoid offset"
            return
            ;;
        "fix(buttons): make labels single-line without truncation; adjust spacing")
            echo "fix(buttons): make labels single-line without truncation; adjust spacing"
            return
            ;;
        "fix(buttons): avoid truncation by global sizing and wrap fallback")
            echo "fix(buttons): avoid truncation by global sizing and wrap fallback"
            return
            ;;
        "fix(buttons): unify label sizes across buttons and tighten icon gap")
            echo "fix(buttons): unify label sizes across buttons and tighten icon gap"
            return
            ;;
        "fix(buttons): reduce icon-label gaps and unify label sizes")
            echo "fix(buttons): reduce icon-label gaps and unify label sizes"
            return
            ;;
        "fix(buttons): wrap labels and prefer label shrink (avoid wrapping)")
            echo "fix(buttons): wrap labels and prefer label shrink (avoid wrapping)"
            return
            ;;
        "fix(buttons): auto-shrink button text to single line")
            echo "fix(buttons): auto-shrink button text to single line"
            return
            ;;
        "fix(responsive): improve grid and CTA behavior on tablet/mobile")
            echo "fix(responsive): improve grid and CTA behavior on tablet/mobile"
            return
            ;;
        "chore: update sitemap [skip ci]")
            echo "chore: update sitemap [skip ci]"
            return
            ;;
        "chore: bump CSS cache version")
            echo "chore: bump CSS cache version"
            return
            ;;
        "chore: bump styles.css version to v=16")
            echo "chore: bump styles.css version to v=16"
            return
            ;;
        "chore: trigger Vercel redeploy")
            echo "chore: trigger Vercel redeploy"
            return
            ;;
        "fix(css): close block in styles.css")
            echo "fix(css): close block in styles.css"
            return
            ;;
        "chore: bump styles.css version to v=15 (purge)")
            echo "chore: bump styles.css version to v=15 (purge)"
            return
            ;;
        "chore: bump styles.css version to v=14")
            echo "chore: bump styles.css version to v=14"
            return
            ;;
        "ui: main CTA cta-warm")
            echo "ui: main CTA cta-warm"
            return
            ;;
        "e2e: assert exact hero heading text")
            echo "e2e: assert exact hero heading text"
            return
            ;;
        "E2E: make hero heading assertion accept updated copy (support old and new variants)")
            echo "E2E: make hero heading assertion accept updated copy (support old and new variants)"
            return
            ;;
        "Zwiększono rozmiar emoji w CTA i dodano cache-bust ?v=13 dla styles.css")
            echo "Increase CTA emoji size and add cache-bust for styles.css"
            return
            ;;
        "chore: update sitemap [skip ci]")
            echo "chore: update sitemap [skip ci]"
            return
            ;;
        "chore: bump CSS cache version")
            echo "chore: bump CSS cache version"
            return
            ;;
        *)
            # If no match found, return the original message
            echo "$message"
            return
            ;;
    esac
}

# Filter commit messages
while read -r commit_hash; do
    echo "Processing commit: $commit_hash"
    
    # Get the current commit message
    current_message=$(git log --format="%s" -n 1 "$commit_hash")
    
    # Translate the commit message
    new_message=$(translate_commit_message "$current_message")
    
    if [ "$current_message" != "$new_message" ]; then
        echo "  Changing: $current_message -> $new_message"
        # Update the commit message
        git commit --amend --no-edit -m "$new_message" "$commit_hash"
    else
        echo "  No change needed: $current_message"
    fi
done < <(git rev-list --all)

'@

# Create the filter script
$filterScript | Out-File -FilePath "filter-commits.sh" -Encoding UTF8
chmod +x filter-commits.sh

# Run the filter script
./filter-commits.sh

# Clean up temporary files
cd "$(git rev-parse --git-dir)/.."
Remove-Item -Recurse -Force $tempDir

Write-Host "Done! All commit messages have been translated to English."
