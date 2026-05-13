import { execSync } from 'node:child_process';

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function safeRun(command) {
  try {
    return { ok: true, output: run(command) };
  } catch (error) {
    return {
      ok: false,
      output: error?.stdout?.toString()?.trim() || error.message,
    };
  }
}

function title(text) {
  console.log(`\n=== ${text} ===`);
}

function checkGitStatus() {
  title('Git Status');
  const branch = safeRun('git rev-parse --abbrev-ref HEAD');
  const status = safeRun('git status --porcelain=v1');

  if (!branch.ok) {
    console.log(`Cannot detect branch: ${branch.output}`);
    return;
  }

  console.log(`Branch: ${branch.output}`);
  if (status.ok && !status.output) {
    console.log('Working tree is clean.');
  } else if (status.ok) {
    console.log('Uncommitted changes detected:');
    console.log(status.output);
  } else {
    console.log(`Cannot read git status: ${status.output}`);
  }
}

function checkNodeProcesses() {
  title('Node Processes');

  // Keep this Windows-friendly because this project is currently managed from Windows.
  const processes = safeRun('tasklist /FI "IMAGENAME eq node.exe"');
  if (!processes.ok) {
    console.log(`Cannot inspect processes: ${processes.output}`);
    return;
  }

  const hasNode = /node\.exe/i.test(processes.output);
  if (!hasNode) {
    console.log('No running node.exe processes detected.');
    return;
  }

  console.log('Running node.exe processes detected. Review before release:');
  console.log(processes.output);
}

function checkMergedBranches(deleteMerged) {
  title('Local Branches');
  safeRun('git fetch --prune');

  const merged = safeRun('git branch --merged');
  if (!merged.ok) {
    console.log(`Cannot inspect merged branches: ${merged.output}`);
    return;
  }

  const branches = merged.output
    .split('\n')
    .map((line) => line.replace('*', '').trim())
    .filter((name) => name && name !== 'main' && name !== 'develop');

  if (branches.length === 0) {
    console.log('No merged local branches to clean.');
    return;
  }

  if (!deleteMerged) {
    console.log('Merged local branches (safe to review/delete):');
    for (const branch of branches) {
      console.log(`- ${branch}`);
    }
    console.log('Run with --delete-merged to remove them automatically.');
    return;
  }

  for (const branch of branches) {
    const deleted = safeRun(`git branch -d ${branch}`);
    if (deleted.ok) {
      console.log(`Deleted branch: ${branch}`);
    } else {
      console.log(`Could not delete ${branch}: ${deleted.output}`);
    }
  }
}

function main() {
  const deleteMerged = process.argv.includes('--delete-merged');

  console.log('Local housekeeping for Szkolne gazetki');
  checkGitStatus();
  checkNodeProcesses();
  checkMergedBranches(deleteMerged);

  title('Done');
  console.log('Review output above before your next production release.');
}

main();
