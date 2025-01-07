# Easy linkedIn comments
This project it a cool and lightweight browser extension for linkedIn that helps create comments based on the context of a post or a reply to a post. 

## Table of Contents
- [Installation](#installation)
- [Development](#development)
- [Usage](#usage)


## Installation
1. Clone the repository:
```bash
git clone https://github.com/mmedr25/easy_linkedIn_comments.git
```

2. Install dependencies:
```bash
npm install # delete "bun.lockb" file
#  or
bun install

#  then
npm install --global web-ext
brew install sass/sass/sass
 ```
3. You may also need to install "make" to run makefile

linux installation
```bash
make --version # check if installed
# else
sudo apt update
sudo apt install make
```
[window installation](https://thrivemyway.com/how-to-install-and-use-make-in-windows/)

4. install ollama
[ollama installation](https://ollama.com/)

install the model "llama3.2-vision"

```bash
launchctl setenv OLLAMA_ORIGINS "*" #cors
```


## Development
```bash
make dev
```


## Usage
1. start ollama and get it url

2. install the extension. You can ask chatgpt how to install an in dev mode :-)

3. configure the extension


Voila!!!