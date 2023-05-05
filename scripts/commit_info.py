import subprocess
import json
import os
import sys

"""GitリポジトリのHEADの情報をJSON形式で出力するスクリプト

カレントディレクトリが属しているリポジトリのコミットハッシュとコミット日時を取得し、
JSON形式で出力するスクリプトです

Examples:
    ```console
    $ python3 commit_info.py
    {"hash": "09fff368d273878896277311ac4a01604eedc3ca", "date": "2023-05-05T21:57:16+09:00"}
    ```

"""


def is_git_repository(path: str):
    """指定したパスがgit管理下にあるかどうかを判定する

    Args:
        path (str): パス
    """
    try:
        subprocess.check_output(["git", "status"], cwd=path, stderr=subprocess.STDOUT)
        return True
    except subprocess.CalledProcessError:
        return False


def print_commit_info(path: str):
    """Gitリポジトリの情報をJSON形式で出力する

    現在は、HEADのコミットハッシュ(hash)とコミット日時(date)を出力している

    Args:
        path (str): パス
    """

    git_log = subprocess.check_output(
        ["git", "log", "-1", '--pretty=format:{%n  "hash": "%H",%n  "date": "%cI"%n}'],
        cwd=path,
    ).decode("utf-8")

    commit_info = json.loads(git_log)

    print(json.dumps(commit_info))


if __name__ == "__main__":
    if is_git_repository(os.getcwd()):
        print_commit_info(os.getcwd())
    else:
        print("The current directory is not inside a Git repository.", file=sys.stderr)
        exit(1)
