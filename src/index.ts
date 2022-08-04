#!/usr/bin/env node

import {Command} from 'commander';
import inquirer from 'inquirer';
import * as path from 'path';
import fse from "fs-extra";
import handlebars from 'handlebars';
import shell from "shelljs";
import ora from "ora";

const program = new Command();

program.usage('<command>');

program
    .name('node-module-cli')
    .description('create a node module scaffolding using Typescript+Rollup+Jest')
    .version('0.0.1')
;

function getQuestions(name: string) {
    const questions = [
        {
            name: 'description',
            message: 'please input description',
            default: '',

        },
        {
            name: 'author',
            message: 'please input author',
            default: '',
        }
    ];
    return !!name ? questions : [{
        name: 'name',
        message: 'please input module name',
        default: '',
    }, ...questions];
}

function gitCheck() {
    if (!shell.which('git')) {
        spinner.fail("Sorry, this script requires git");
        shell.exit(1);
    }
    spinner.succeed("git checked...");
}

function gitClone(params: Record<string, string>) {
    const template_version = "v1.0.2";
    const template_repo = "https://github.com/feyond/node-module-demo.git";
    let dest = process.cwd();
    spinner.info("Repo: " + template_repo);
    spinner.info("Version: " + template_version);
    spinner.start("start download template ... ");
    const { stdout, stderr, code } = shell.exec(`git clone -b ${template_version} --single-branch ${template_repo} ${params.name}`, {silent: true});
    if (code !== 0) {
        // shell.('git clone failed...' + stderr);
        spinner.fail("download failed ...");
        !!stderr && spinner.info(stderr);
        !!stdout && spinner.info(stdout);
        shell.exit(1);
    }
    spinner.succeed("download success ...");
    let destPath = path.join(dest, params.name);
    spinner.info("Local Path: " + destPath);
    return destPath;
}

function init(dest: string, params: Record<string, string>) {
    spinner.start("init template ...");
    fse.removeSync(path.join(dest, ".git"));

    const pkgPath = path.join(dest, "package.json");
    const content = fse.readFileSync(pkgPath).toString();
    const template = handlebars.compile(content);
    const result = template(params);
    fse.writeFileSync(pkgPath, result);
    spinner.succeed("replacing package.json success");

    spinner.start("npm install ... \n");
    shell.cd(dest);
    shell.exec("npm install");
    spinner.succeed("template init success!");
}

const spinner = ora('start init node module...').start();
// <required> or [optional]
program
    // .command('init <name>')
    // .description('created module name')
    .command('init')
    .argument("[name]", "create module name?")
    .action(async (moduleName: string) => {
        !!moduleName && spinner.info("init module name: " + moduleName);
        spinner.isSpinning && spinner.stop();
        const answers = await inquirer.prompt(getQuestions(moduleName));
        const params = {name: moduleName, ...answers};

        gitCheck();
        let dest = gitClone(params);
        init(dest, params);
        spinner.isSpinning && spinner.stop();
    })
;

program.parse()
;