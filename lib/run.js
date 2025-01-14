const { exec } = require('child_process');
const { conf } = require('./conf');
const { parseRemoteRepoLink } = require('./parse');
const { githubAuth } = require('./github');

module.exports = {
    processResearch: async (path, file) => {
        const compiled = `${file.substring(0, file.length - 3)}.gfm.md`;

        await exec(
            `quarto render ${file} -o=${path}/research/${compiled}`,
            {
                cwd: `${path}/_research`,
            },
            async (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(
                        `Compiled research created: \n${path}/research/${compiled}`
                    );
                    return;
                }
                console.log(`stdout: ${stdout}`);
            }
        );
    },

    publishResearch: async (path, research) => {
        const { owner, repo } = parseRemoteRepoLink(conf.get('repo.link'));
        const message = `"Publishing ${research.title} #${research.number}"`;

        let allPullRequests = await githubAuth().rest.pulls.list({
            owner,
            repo,
        });

        allPullRequests = allPullRequests.data.map(
            (pr) => pr.head.label.split(':')[1]
        );

        const pullRequestExists = allPullRequests.includes(research.branch);

        const cmd = `export GITHUB_TOKEN=${conf.get('github.token')} && 
            git checkout ${research.branch} && 
            git add --all && 
            git commit -m ${message} && 
            git push origin ${research.branch}${
            pullRequestExists ? '' : ' && hub pull-request --no-edit'
        }`;

        await exec(
            cmd,
            {
                cwd: path,
            },
            async (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`Published research : ${research.branch}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            }
        );
    },

    fetchAll: async (path) => {
        await exec(
            'git fetch --all',
            {
                cwd: path,
            },
            async (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log('Synchronized repository');
                }
            }
        );
    },
};
