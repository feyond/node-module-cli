#!/usr/bin/env node

import {Command} from 'commander';
import inquirer from 'inquirer';
import * as path from 'path';
import fse from "fs-extra";
import handlebars from 'handlebars';
import shell from "shelljs";

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

// <required> or [optional]
program
    // .command('init <name>')
    // .description('created module name')
    .command('init')
    .argument("[name]", "create module name?")
    .action(async (moduleName: string) => {
        !!moduleName && console.log('start init node module:', moduleName);
        const answers = await inquirer.prompt(getQuestions(moduleName));
        const params = {name: moduleName, ...answers};

        if (!shell.which('git')) {
            shell.echo('Sorry, this script requires git');
            shell.exit(1);
        }

        let dest = process.cwd();
        shell.cd(dest);
        const { stdout, stderr, code } = shell.exec(`git clone https://github.com/feyond/node-module-demo.git ${params.name}`, {silent: true});

        if (code !== 0) {
            shell.echo('git clone failed...' + stderr);
            shell.exit(1);
        }
        !!stdout && console.log(stdout);
        !!stderr && console.log(stderr);

        // 引入path模块，模板目录写绝对路径
        // const __filename = fileURLToPath(import.meta.url);
        // const __dirname = dirname(__filename);
        // // const __dirname = path.resolve(path.dirname(''));
        // const tmplDir = path.join(__dirname, 'templates');
        // const cwd = process.cwd();
        // const destDir = path.join(cwd, params.name);
        // fse.mkdirSync(destDir);
        // fse.copySync(tmplDir, destDir);
        //
        fse.removeSync(path.join(dest, params.name, ".git"));
        const pkgPath = path.join(dest, params.name, "package.json");
        const content = fse.readFileSync(pkgPath).toString();
        const template = handlebars.compile(content);
        const result = template(params);
        fse.writeFileSync(pkgPath, result);
    })
;

program.parse()
;