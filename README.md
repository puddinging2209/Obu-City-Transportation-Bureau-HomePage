# 大府市交通局ホームぺージ

## このウェブサイトには架空の情報が含まれています

趣味で制作している架空鉄道「大府市営地下鉄」を含む大府市交通局のホームページです。

大府市営地下鉄と、実在する大府市循環バスふれあいバスの情報を掲載しています。

掲載されている駅、列車、鉄道の時刻等は架空のものですのでご注意ください。

ふれあいバスについても、情報が間違っている場合があります。あらかじめご了承ください。

LocalStorage の visitedStations に最寄り駅として読み込んだことのある駅名をJSON配列として保存するよう変更しました。
よろしくお願いします。
PWA化もお願いします。

---

以下LLM出力

---

## License Summary / ライセンス概要

- This repository uses **multiple licenses**, applied per directory.
- Files under `tools/Parsers` are licensed under **GPL-3.0 or later**.
- All other source code is **not licensed under GPL**.
- Files under `public/oud/` are **generated data**, not subject to GPL.

---

- 本リポジトリは **複数のライセンス** をディレクトリ単位で採用しています。
- `tools/Parsers` 配下のファイルは **GPL-3.0 以降** で提供されます。
- それ以外のコードは **GPL ライセンスではありません**。

## License / ライセンス

This repository contains both original code and code derived from third-party projects.
Licensing is applied **per directory**, as described below.

このリポジトリには、本プロジェクトで作成したオリジナルコードと、
第三者が公開しているコードを改変して利用している部分が含まれています。
ライセンスは **ディレクトリ単位** で適用されています。

---

### tools/Parsers

Files under `tools/Parsers` are **derived from the following project**:

- clouddia  
  https://github.com/01397/clouddia  
  © 大井さかな

These files are licensed under the  
**GNU General Public License v3.0 or later (GPL-3.0+)**.

- Modifications have been made for this project
- See `tools/Parsers/LICENSE` for the full license text
- Each modified file contains a notice describing the original source and changes

#### 日本語説明

`tools/Parsers` ディレクトリ内のファイルは、以下のプロジェクトを元にしています。

- clouddia  
  https://github.com/01397/clouddia  
  © 大井さかな

これらのファイルは  
**GNU General Public License バージョン3 以降（GPL-3.0+）**  
のもとで配布されています。

- 本プロジェクト向けに一部改変を行っています
- ライセンス全文は `tools/Parsers/LICENSE` を参照してください
- 各ソースファイル冒頭に、元スクリプトと改変内容を明記しています

---

### Other files / その他のファイル

All other files in this repository **not under `tools/Parsers`** are original works
created for this project, unless stated otherwise.

`tools/Parsers` 以外のファイルは、特に明記のない限り
本プロジェクトのために作成したオリジナルのコードです。

They are currently distributed under the repository’s main license.

これらのファイルは、リポジトリのメインライセンスに基づいて配布されます。
