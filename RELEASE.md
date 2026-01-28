# Release

## Create release

Do not manually draft a release.

To start a release, create a release tag at the commit you want using the commands
below.

```shell
git tag -a "v1.2.3" -m "v1.2.3"
git push origin "v1.2.3"
```

## Publish GitHub Action to the marketplace

1. Go to the [Releases page](https://github.com/fjogeleit/http-request-action/releases)
and select the latest release that was just created.
2. Select "Edit" button.
3. Select "Publish this Action to the GitHub Marketplace" checkbox.
4. Select "Update release" button.
