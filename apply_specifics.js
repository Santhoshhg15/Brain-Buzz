const fs = require("fs");

function replaceInFile(filepath, replaces) {
  if (fs.existsSync(filepath)) {
    let code = fs.readFileSync(filepath, "utf8");
    replaces.forEach(r => {
      code = code.replace(r.search, r.replace);
    });
    fs.writeFileSync(filepath, code);
  }
}

// Wire useCountUp
const addCountUpImport = (app) => ({
  search: /import \{([^}]+)\} from "\.\.\/store\//,
  replace: `import { useCountUp } from "../hooks/useCountUp";\nimport {$1} from "../store/`
});

// Play RevealScreen
replaceInFile("apps/play/src/screens/RevealScreen.tsx", [
  addCountUpImport("play"),
  {
    search: /const myScore = leaderboard\?\.find\(e => e\.id === participantId\)\?\.score \|\| 0;/,
    replace: `const targetScore = leaderboard?.find(e => e.id === participantId)?.score || 0;\n  const myScore = useCountUp(targetScore);`
  },
  { search: />Correct!</, replace: `>Nailed it! 🎉<` },
  { search: />Incorrect</, replace: `>Not quite!<` },
  { search: />Waiting for next question\.\.\.</, replace: `>Hang tight, the host is getting things ready...<` }
]);

// Play EndedScreen (Check if it has myScore)
replaceInFile("apps/play/src/screens/EndedScreen.tsx", [
  addCountUpImport("play"),
  {
    search: /const myScore = leaderboard\?\.find\(e => e\.id === participantId\)\?\.score \|\| 0;/,
    replace: `const targetScore = leaderboard?.find(e => e.id === participantId)?.score || 0;\n  const myScore = useCountUp(targetScore);`
  },
  {
    search: /You finished in/,
    replace: `Great effort! You finished in`
  }
]);

// Host RevealScreen
replaceInFile("apps/host/src/screens/RevealScreen.tsx", [
  addCountUpImport("host"),
  {
    search: /\{entry\.score\}/g,
    replace: `{useCountUp(entry.score)}`
  }
]);

// Host EndedScreen
replaceInFile("apps/host/src/screens/EndedScreen.tsx", [
  addCountUpImport("host"),
  {
    search: /\{entry\.score\}/g,
    replace: `{useCountUp(entry.score)}`
  }
]);

// Display RevealDisplayScreen
replaceInFile("apps/display/src/screens/RevealDisplayScreen.tsx", [
  addCountUpImport("display"),
  {
    search: /\{entry\.score\}/g,
    replace: `{useCountUp(entry.score)}`
  }
]);

// Display EndedDisplayScreen
replaceInFile("apps/display/src/screens/EndedDisplayScreen.tsx", [
  addCountUpImport("display"),
  {
    search: /\{leaderboard\[1\]\.score\}/,
    replace: `{useCountUp(leaderboard[1].score)}`
  },
  {
    search: /\{leaderboard\[0\]\.score\}/,
    replace: `{useCountUp(leaderboard[0].score)}`
  },
  {
    search: /\{leaderboard\[2\]\.score\}/,
    replace: `{useCountUp(leaderboard[2].score)}`
  },
  {
    search: /\{entry\.score\}/g,
    replace: `{useCountUp(entry.score)}`
  },
  {
    search: />Final Results</,
    replace: `>🏆 Final Results!<`
  }
]);

// Skeletons - SelectQuizScreen
const skeletonHtml = `<div className="flex gap-6 w-full max-w-5xl">
          <div className="skeleton w-1/3 h-32"></div>
          <div className="skeleton w-1/3 h-32"></div>
          <div className="skeleton w-1/3 h-32"></div>
        </div>`;
replaceInFile("apps/host/src/screens/SelectQuizScreen.tsx", [
  {
    search: /<div className="text-\[var\(--color-text-secondary\)\] text-xl animate-pulse">Loading quizzes\.\.\.<\/div>/,
    replace: skeletonHtml
  }
]);

// Play AnsweredScreen - Skeleton
replaceInFile("apps/play/src/screens/AnsweredScreen.tsx", [
  {
    search: /className="animate-spin h-8 w-8 text-indigo-500 mb-4"/,
    replace: `className="skeleton w-12 h-12 rounded-full mb-6 mx-auto"`
  },
  {
    search: /<svg.*?<\/svg>/s,
    replace: `` // Remove the spinner SVG, the skeleton div handles it.
  },
  {
    search: />Waiting for everyone to answer\.\.\.</,
    replace: `>Let's see how everyone did...<`
  }
]);

// Host LobbyScreen copy
replaceInFile("apps/host/src/screens/LobbyScreen.tsx", [
  {
    search: />Waiting for players to connect\.\.\.</,
    replace: `>Waiting for students to join the room...<`
  }
]);

// Display LobbyDisplayScreen copy
replaceInFile("apps/display/src/screens/LobbyDisplayScreen.tsx", [
  {
    search: />Waiting for players to connect\.\.\.</,
    replace: `>Get ready — students are joining now!<`
  }
]);

console.log("Specifics applied");
