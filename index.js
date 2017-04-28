#!/usr/bin/node --harmony
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Module dependencies.
 */
const fs = require('fs');
const path = require('path');
const _prompt = require('prompt');
const jsonfile = require('jsonfile');
const request = require('request');
const semver = require('semver');
const program = require('commander');
const ProgressBar = require('progress');
/**
 * Default config.
 */
const CONFIG = {
    FILE: '.changelogrc',
    HOST: 'git.cairenhui.com',
    API: 'http://git.cairenhui.com/api/v3',
    OUTPUT: 'CHANGELOG.md'
};
const PROMPT = {
    // description display at the top of console when prompting
    DESC: 'You have not configured it yet, have you?\n' +
        'Please to work it out with the interactive prompt below.\n' +
        'It will create a config file (.changelogrc) in your system.\n\n' +
        '(If you have no idea about what token is, find it in your gitlab site by ' +
        'following "Profile Setting" - "Account" - "Reset Private token")\n\n' +
        'Press ^C at any time to quit.\n',
    // options for prompt
    OPTIONS: [
        {
            name: 'host',
            message: 'Your gitlab host',
            default: CONFIG.HOST
        },
        {
            name: 'api',
            message: 'Your gitlab api',
            default: CONFIG.API
        },
        {
            name: 'token',
            message: 'Your private token'
        }
    ]
};
// absolute path of current project
const root = process.cwd();
// config file: ~/.changelogrc
const configFile = path.resolve(process.env.HOME, CONFIG.FILE);
// CLI control
program
    .version(require('./package').version)
    .parse(process.argv);
(function () {
    'use strict';
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let config = yield getConfing();
            if (!config) {
                config = yield createConfigFile();
            }
            const host = config.host;
            const api = config.api;
            const token = config.token;
            const milestoneId = '';
            const issuesApi = `${api}/issues?milestone=${milestoneId}&private_token=${token}`;
            const logs = yield generateLogs(issuesApi);
            // Generating changelog of current project
            generateChangeLogg(logs);
            // generateChangeLog(logs);
        }
        catch (e) {
            console.error(e);
        }
    });
})();
function getConfing() {
    return new Promise((resolve, reject) => {
        jsonfile.readFile(configFile, (e, data) => {
            if (!e) {
                resolve(data);
            }
            else {
                resolve(false);
            }
        });
    });
}
function createConfigFile() {
    return new Promise((resolve, reject) => {
        console.log(PROMPT.DESC);
        _prompt.message = 'Enter';
        _prompt.start();
        _prompt.get(PROMPT.OPTIONS, (e, result) => {
            if (e) {
                reject(`\n${e}`);
                return;
            }
            const content = {
                host: result.host,
                api: result.api,
                token: result.token
            };
            jsonfile.writeFile(configFile, content, (e) => {
                if (!e) {
                    console.log('\n');
                    resolve(content);
                }
                else {
                    reject(`Unable to write file: ${configFile}`);
                }
            });
        });
    });
}
/**
 * Fetch all the milestones from the given api.
 *
 * @param  {string} api
 * @example of the api:
 * http://git.cairenhui.com/api/v3/projects/OOS%2Foos-web-fe/milestones??per_page=30&private_token=Wk9deBZUz9_6gPZbysxj
 */
// function fetchMilestones(api) {
//     const promise = new Promise((resolve, reject) => {
//         request(api, (e, response, body) => {
//             if (!e && response.statusCode === 200) {
//                 const milestones = JSON.parse(body);
//                 if (milestones.length) {
//                     resolve(milestones);
//                 }
//                 else {
//                     reject('There\'s no milestone yet.');
//                 }
//             }
//             else if (response) {
//                 reject(`Unable to fetch milestones because: ${JSON.parse(response.body).message}.`);
//             }
//             else {
//                 reject(e);
//             }
//         })
//             .on('response', () => {
//             console.log('Starting to fetch all the milestones of this project.\n');
//         });
//     });
//     promise.then((response) => {
//         if (response.length > 1) {
//             console.log(`Get ${response.length} milestones totally.\nGetting start to fetch all the issues of these milestones:\n`);
//         }
//         else if (response.length === 1) {
//             console.log('Get only one milestone, fetch the issues of this milestone:\n');
//         }
//     });
//     return promise;
// }
/**
 * * Generating all the logs from milestones and the given api.
 *
 * @param  {IMilestone[]} milestones
 * @param  {string} api
 */
function generateLogs(api) {
    'use strict';
    return __awaiter(this, void 0, void 0, function* () {
        let promise = generateLog(api);
        // const barOpts = {
        //     complete: '=',
        //     incomplete: ' ',
        //     width: 20
        //     // total: promises.length
        // };
        // const bar = new ProgressBar('  fetching issues [:bar] :percent :elapseds', barOpts);
        // promise.then(() => {
        //     bar.tick();
        // });
        return yield promise;
    });
}
/**
 * Generatin single log from specific milestone and the given api.
 *
 * @param  {IMilestone} milestone
 * @param  {string} api
 */
function generateLog(api) {
    return new Promise((resolve, reject) => {
        request(api, (e, response, body) => {
            'use strict';
            if (!e && response.statusCode === 200) {
                const issues = JSON.parse(body);
                let content = issues;
                resolve({
                    content: content
                });
            }
            else if (response) {
                reject(`Unable to fetch issues of ${milestoneId} milestone because: ${JSON.parse(response.body).message}`);
            }
            else {
                reject(e);
            }
        });
    });
}
/**
 * Write the changelog into the output file.
 *
 * @param  {ILog[]} logs
 */
function generateChangeLogg(logs) {
    'use strict';
    console.log(`\nGenerating changelog into ${CONFIG.OUTPUT}`);
    // logs = logs.sort(compareVersions);
    console.log(logs)
    let body = logs.map((log) => {
        return log.content.join('\n');
    });
    // console.log(body)
    body = body.join('\n\n');
    fs.writeFile(CONFIG.OUTPUT, body, (e) => {
        if (!e) {
            console.log(`\nOK, ${CONFIG.OUTPUT} generated successfully!`);
        }
        else {
            console.error(e);
        }
    });
}
/**
 * Write the changelog into the output file.
 *
 * @param  {ILog[]} logs
 */
// function generateChangeLog(logs) {
//     'use strict';
//     console.log(`\nGenerating changelog into ${CONFIG.OUTPUT}`);
//     // logs = logs.sort(compareVersions);
//     // console.log(logs)
//     let body = logs.map((log) => {
//             return log.content.join('\n');
// });
//     // console.log(body)
//     body = body.join('\n\n');
//     fs.writeFile(CONFIG.OUTPUT, body, (e) => {
//         if (!e) {
//         console.log(`\nOK, ${CONFIG.OUTPUT} generated successfully!`);
//     }
// else {
//         console.error(e);
//     }
// });
// }
/**
 * Get the full path of the current project.
 *
 * @param  {string} host
 * @return {string} projectPath
 */
// function getProjectPath(host) {
//     'use strict';
//     let gitConfig;
//     let projectPath;
//     try {
//         gitConfig = fs.readFileSync('.git/config', 'utf8');
//     }
//     catch (e) {
//         throw `It can't be done because it's not a git project.`;
//     }
//     try {
//         projectPath = `${gitConfig}`.split(host)[1].split('\n')[0].replace(/(\:|\.git)/g, '');
//     }
//     catch (e) {
//         throw `No gitlab project found in ${root}`;
//     }
//     return projectPath;
// }
/**
 * Semver comparator
 *
 * @param  {ILog} log1
 * @param  {ILog} log2
 * @return {-1, 0, 1}
 *        Return 0 if v1 == v2,
 *        or 1 if v1 is greater,
 *        or -1 if v2 is greater.
 *        Sorts in ascending order if passed to Array.sort().
 */
// function compareVersions(log1, log2) {
//     const v1 = semver.clean(log1.version);
//     const v2 = semver.clean(log2.version);
//     if (!v1 || !v2) {
//         return;
//     }
//     return semver.rcompare(v1, v2);
// }
