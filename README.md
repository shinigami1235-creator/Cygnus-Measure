# Cygnus Measurement Tool

Before and after facial measurement from photographs. Displacement in
millimetres and wrinkle line measurement.

Live at https://shinigami1235-creator.github.io/Cygnus-Measure/

Version 2.5.3.

## Nothing patient related leaves the device

There is no server side. Photographs, marks and results live in the page
and in the file the examiner saves. GitHub only hands out the program.

Say this to testers. A web address makes people assume the opposite.

## What is in here

| File | What it is |
|---|---|
| `index.html` | the whole program, one file |
| `measurement-protocol.html` | the printable chairside sheet |
| `manifest.json` | the name and icons used when it is added to a home screen |
| `sw.js` | keeps a copy on the device so it opens with no signal |
| `.nojekyll` | stops GitHub running the push through Jekyll |
| `facial-measure.html` | sends the old file name to the program |
| `icon-*.png`, `favicon.*` | the icons |

## Do not edit these files here

They are built. Edit `facial-measure.html` in the working folder, run
`node build-site.mjs`, run `node tests/mtest7.mjs`, then push what comes out.

## Updating it

Push to `main`. Pages redeploys on its own, usually inside a minute.

Anyone with the program already open gets a bar at the bottom saying a
newer version is ready, with a Reload button. Tell them to press it.
Without a reload they keep running the copy on their device.
