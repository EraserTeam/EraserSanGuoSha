import fs = require('fs');
import path = require('path');
class PackageLoader {
    private static load(ff: string): any[] {
        let arr: any[] = [];
        let self = __filename.substring(__dirname.length + 1);
        let files = fs.readdirSync(ff);
        files.forEach((fn) => {
            if (fn == self) return;
            let fname = ff + path.sep + fn;
            let stat = fs.lstatSync(fname);
            if (stat.isDirectory() == true) {
                arr.push.apply(arr, PackageLoader.load(fname));
            } else {
                let pos = fn.lastIndexOf('.');
                if (pos == -1) return;
                let filePrefix = fn.substr(0, pos);
                let filePostfix = fn.substr(pos + 1);
                if (filePrefix.length < 1 || filePostfix.length < 1 || filePostfix != 'js') return;
                arr.push(require(ff + '/' + filePrefix));
            }
        });
        return arr;
    }
    public static loadCardPackages(): any[] {
        return PackageLoader.load(__dirname + path.sep + 'card');
    }
    public static loadGeneralPackages(): any[] {
        return PackageLoader.load(__dirname + path.sep + 'general');
    }
    public static loadModes(): any[] {
        return PackageLoader.load(__dirname + path.sep + 'mode');
    }
}
export default PackageLoader;
