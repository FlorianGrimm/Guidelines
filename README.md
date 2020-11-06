# Guidelines

Currently a test for PCF Control

*Alpha version do not use*!!

```
mkdir Guidelines
cd Guidelines
pac solution init --publisher-name FlorianGrimm --publisher-prefix fgr

msbuild /t:build /restore

mkdir Guidelines1
cd Guidelines1
pac pcf init --namespace FlorianGrimm --name Guidelines1 --template field
npm install

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