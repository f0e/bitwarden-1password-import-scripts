quick script to add correct creation & update dates along with password history from bitwarden to 1pux exports.
this was made since [mrc-converter-suite](https://1password.community/discussion/30286/mrcs-convert-to-1password-utility-mrc-converter-suite) doesn't import those fields.

to use:

1. rename your 1pux export to be .zip
2. extract the zip, go inside and copy the path of the export.data file to --1password-path
3. copy the path of your bitwarden export json to --bitwarden-path
4. copy your extracted 1pux folder. this is your output folder. go inside and copy the path of the export.data file inside this output folder to --out-path
5. add --cutoff-date, which acts as the search cutoff. any 1password items created or modified after this time won't be matched to bitwarden. these items will be printed to console if you need to manually match them.
6. run, and if successful re-compress the output folder and rename it to be a .1pux file
7. import to 1password (probably have to delete all your existing items first)