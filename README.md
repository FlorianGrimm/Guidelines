# Guidelines

Currently a test for PCF Control

*Alpha version do not use*!!

```
mkdir Guidelines
cd Guidelines
pac solution init --publisher-name FlorianGrimm --publisher-prefix fgr
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
msbuild /t:build /restore

code GuidelinesHot
code Guidelines1


npm run build
npm run start watch

msbuild /t:rebuild /p:configuration=Debug

msbuild /t:rebuild /p:configuration=Release

Guidelines1\node_modules\pcf-start\bin\pcf-start.js
GuidelinesHot\node_modules\pcf-start\bin\pcf-start.js
```