#!/bin/bash

set -euo pipefail

function push_submodule_commit () {
  SUBMODULE_DIR_PATH=$1
  NEXT_VERSION=$2
  ORIGIN=$3
  pushd $SUBMODULE_DIR_PATH > /dev/null

  NOT_PUSH_COMMIT_CNT=$(git log --oneline origin/${NEXT_VERSION}..${NEXT_VERSION} | wc -l)
  echo $NOT_PUSH_COMMIT_CNT
  if [[ $NOT_PUSH_COMMIT_CNT -ne 0 ]]; then
    echo "[info] ${SUBMODULE_DIR_PATH} の新ブランチをpushします。 "
    git push $ORIGIN $NEXT_VERSION
  else
    echo "[info] ${SUBMODULE_DIR_PATH} の新ブランチはpush済みです。"
  fi

  popd > /dev/null
}

function update_gitmodules () {
  NEXT_VERSION=$1
  ORIGIN=$2

  SUBMODULE_DIR_PATH_LIST=$(cat .gitmodules | grep "path = " | awk '{ printf $3 "\n" }')
  echo "$SUBMODULE_DIR_PATH_LIST" | while read SUBMODULE_DIR_PATH; do
    pushd $SUBMODULE_DIR_PATH > /dev/null
    DIFF_CNT=$(git status -s 2> /dev/null | wc -l)
    if [[ $DIFF_CNT -ne 0 ]]; then
      echo "[error] ${SUBMODULE_DIR_PATH} にコミットされていない変更があります。"
      exit 1
    fi

    git checkout master > /dev/null 2>&1
    git pull origin master > /dev/null 2>&1
    MERGE_RESULT=$(git merge --no-commit --no-ff $NEXT_VERSION 2> /dev/null)
    git merge --abort > /dev/null 2>&1 || true
    git checkout $NEXT_VERSION > /dev/null 2>&1
    popd > /dev/null

    if [[ $MERGE_RESULT == "Already up to date." ]]; then
      echo "[warn] ${SUBMODULE_DIR_PATH} の新ブランチにコミットがありません。"
      git config -f .gitmodules --replace-all submodule.${SUBMODULE_DIR_PATH}.branch master
    else
      echo "[info] ${SUBMODULE_DIR_PATH} の新ブランチを使用します。 "
      git config -f .gitmodules --replace-all submodule.${SUBMODULE_DIR_PATH}.branch $NEXT_VERSION

      push_submodule_commit $SUBMODULE_DIR_PATH $NEXT_VERSION $ORIGIN
    fi
  done
}

function commit () {
  COMMIT_MESSAGE="$1"

  git add .
  git commit -a -m "$COMMIT_MESSAGE"
}

function main () {
  COMMIT_MESSAGE="$1"
  NEXT_VERSION=$(git branch --show-current)
  echo "[info] NEXT_VERSION: $NEXT_VERSION"

  update_gitmodules $NEXT_VERSION "github"

  commit "$COMMIT_MESSAGE"
}

DEFAULT_COMMIT_MESSAGE="update: .gitmodules"
main ${1:-"$DEFAULT_COMMIT_MESSAGE"}

