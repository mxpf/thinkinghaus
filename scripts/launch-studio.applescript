on run
  set projectPath to "/Users/mxpf/Documents/Portfolio 2/thinkinghaus"
  set launchCommand to "cd " & quoted form of projectPath & " && npm run studio >> /tmp/thinkinghaus-studio.log 2>&1 &"
  tell application "Terminal"
    do script launchCommand
    set miniaturized of front window to true
  end tell
end run
