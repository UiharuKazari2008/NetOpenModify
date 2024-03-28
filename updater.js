(async () => {
    const fs = require('fs');
    const path = require('path');
    const yargs = require('yargs/yargs');
    const { hideBin } = require('yargs/helpers');
    const xml2js = require('xml2js');

    const ca = yargs(hideBin(process.argv))
        .option('input', {
            alias: 'd',
            type: 'string',
            description: 'Options Directory to search'
        })
        .option('sample', {
            alias: 'a',
            type: 'string',
            description: 'XML Sample to use to get current versions'
        })
        .option('versionID', {
            alias: 'i',
            type: 'string',
            description: 'NetOpenName\\id'
        })
        .option('versionStr', {
            alias: 's',
            type: 'string',
            description: 'NetOpenName\\str'
        })
        .argv

    function searchDirectory(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(async (file) => {
            const filePath = path.resolve(path.join(dir, file));
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                searchDirectory(filePath);
            } else if (path.extname(file).toLowerCase() === '.xml') {
                const f = (fs.readFileSync(filePath)).toString();
                const xml = await new Promise(ok => {
                    xml2js.parseString(f, (err, result) => {
                        if (err) {
                            console.log('Error parsing XML:', err.message);
                            ok(false);
                        }
                        try {
                            const firstNode = Object.keys(result)
                            if (result[firstNode]['netOpenName'] && result[firstNode]['netOpenName'].length > 0) {
                                result[firstNode]['netOpenName'][0]['id'] = [id.toString()];
                                result[firstNode]['netOpenName'][0]['str'] = [str.toString()];
                                const builder = new xml2js.Builder();
                                const updatedXml = builder.buildObject(result);
                                ok(updatedXml);
                            } else {
                                ok(false);
                            }
                        } catch (e) {
                            console.log('Error updating XML:', err.message);
                            ok(false);
                        }
                    });
                })
                if (xml) {
                    fs.writeFileSync(filePath, xml.toString(), {encoding: "utf8"})
                }
            }
        });
    }

    let id = ca.versionID || undefined;
    let str = ca.versionStr || undefined
    if (ca.sample) {
        const f = (fs.readFileSync(path.resolve(ca.sample))).toString();
        await new Promise(ok => {
            xml2js.parseString(f, (err, result) => {
                if (err) {
                    console.log('Error parsing XML:', err.message);
                    ok(false);
                }
                try {
                    const firstNode = Object.keys(result)
                    if (result[firstNode]['netOpenName'] && result[firstNode]['netOpenName'].length > 0) {
                        id = result[firstNode]['netOpenName'][0]['id'][0];
                        str = result[firstNode]['netOpenName'][0]['str'][0];
                        ok(true);
                    } else {
                        ok(false);
                    }
                } catch (e) {
                    console.log('Unable to read XML:', err.message);
                    ok(false);
                }
            });
        })
    }

    if (ca.input && ((ca.versionID && ca.versionStr) || (id && str))) {
        const dir = path.resolve(ca.input)
        searchDirectory(dir);
    } else {
        console.error("Forgot something fucker")
    }
})()
