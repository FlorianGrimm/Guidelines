# Guidelines

Currently a test for PCF Control

*Alpha version do not use*!!

```
pac install latest

mkdir Guidelines
cd Guidelines
pac solution init --publisher-name FlorianGrimm --publisher-prefix fgr

msbuild /t:build /restore
msbuild /t:rebuild /restore

mkdir GuidelinesControl
cd GuidelinesControl
pac pcf init --namespace FlorianGrimm --name GuidelinesControl --template field
npm install
npm install react react-dom ste-events --save
npm install @types/react @types/react-dom @types/xrm --save-dev


mkdir GuidelinesHot
cd GuidelinesHot
pac pcf init --namespace FlorianGrimm --name GuidelinesHot --template field
npm install

cd ..
pac solution add-reference --path .\GuidelinesHot
pac solution add-reference --path .\Guidelines1

code GuidelinesHot
code Guidelines1


```

## Modification 
on each computer..
Guidelines1\node_modules\pcf-start\bin\pcf-start.js
```
// Start server
var options = {
    port: 8182,
    cors: true,
```

GuidelinesHot\node_modules\pcf-start\bin\pcf-start.js
```
// Start server
var options = {
    port: 8183,

```

# Compile
```
npm run build
npm run start watch
```

# Build for publish

```
msbuild /t:build /restore
msbuild /t:rebuild /p:configuration=Debug
```


```
msbuild /t:build /restore
msbuild /t:rebuild /p:configuration=Release
```

#hacks
```
enalbe logging
window.localStorage.setItem('GuidelinesControl#Logger', '{enableDebug:true, enableLog:true, enableError:true}')

window.localStorage.setItem("HotReload#GuidelinesControl#enabled", "On");
window.localStorage.setItem("HotReload#GuidelinesControl#Url", "http://127.0.0.1:8181/bundle.js");

window.localStorage.setItem("HotReload#GuidelinesControl#enabled", "Off");
window.localStorage.setItem("HotReload#GuidelinesControl#Url", "http://127.0.0.1:8181/bundle.js");
```

node_modules\pcf-scripts\webpackConfig.js
```
    const oobConfig = {
        // `production` mode will minify, while `development` will optimize for debugging.
        mode: buildMode,
        devtool:"inline-source-map",
        watch: watchFlag,
```

```
    const oobConfig = {
        // `production` mode will minify, while `development` will optimize for debugging.
        mode: "production",
        watch: watchFlag,
```

```
    const isRelease = true;
    const oobConfig = {
        // `production` mode will minify, while `development` will optimize for debugging.
        mode: (isRelease)?"production":buildMode,
        devtool: (isRelease)?undefined:"inline-source-map",
        watch: watchFlag,
```
