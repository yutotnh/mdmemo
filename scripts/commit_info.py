import subprocess
import json

"""ビルド時にHEADの情報をJSON形式で出力するスクリプト

ビルド時にコミットハッシュとコミット日時を取得し、
JSON形式で出力するスクリプトです
"""

git_log = subprocess.check_output(
    ["git", "log", "-1", '--pretty=format:{%n  "hash": "%H",%n  "date": "%cI"%n}']
).decode("utf-8")

commit_info = json.loads(git_log)

print(json.dumps(commit_info))
