/**
 * @param {JSON} inp 
 * @returns {Map<String, Map>}
 */
function jsonToMapRecursive(inp) {
    if (typeof(inp) != 'object') {
        return inp;
    }
    
    let m2 = new Map();
    Object.entries(inp).forEach((key) => { m2.set(key[0], jsonToMapRecursive(inp[key[0]])); });
    return m2;
}


/**
 * 
 * @param {Map} inp
 * @param {int} layer
 * @returns The map in string format
 * 
 * @example
 * {"key1": "val1", "key2": "key3": {"key4": "Val4"}} ==>>
 * `
 * |-- key1
 * |   |-- val1
 * |
 * |-- key2
 * |   |-- val3
 * |   |   |-- key4
 * |   |   |   |--val4
 * `
 */
function mapToTableRecursive(inp, layer = 1) {
    var temp = '';

    if (typeof(inp) != 'object') {
        // return `?[${inp}]`;
        return '';
    }

    Array.from(inp.keys()).forEach((key) => {
        var keyTemp = ('|     ').repeat(layer);
        temp += `${keyTemp}- - ${key}\n`.replaceAll('     - -', '- -');
        temp += mapToTable(inp.get(key), layer + 1);
    });

    temp += ('|     ').repeat(layer - 1) + '\n';

    if (layer == 1) {
        var links = new Array();

        //Post-processing
        var l = temp.split('\n')

        l = l.filter((entry, ind) => {
            return entry.trim() == '|' || !((/[^A-Za-z0-9 ]+$/).test(entry.trim()) && (/[^A-Za-z0-9 ]+$/).test(l[ind + 1].trim()));
        });

        temp = l.join('\n')

        //Get the links
        Array.from(inp.keys()).forEach((key) => {
            links.push(key);
        });

        return [temp, links];
    }

    return temp;
}



