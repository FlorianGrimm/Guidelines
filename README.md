# Guidelines

Currently a test for PCF Control

*Alpha version do not use*!!

```
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