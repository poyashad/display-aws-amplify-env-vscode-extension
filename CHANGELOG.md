# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [Unreleased]

- Initial release

## [0.0.7] - 2022-05-16

### Added

- Feature for listing environments, checking out environments and creating environments.
- Added Amplify Push, Pull and Status in the listing.

### Fixed

- Removed Code Duplication

## [1.0.0] - 2022-05-23

### Added

- Amplify Icon in the status bar
- Progress Notification when changing environment
- Child process when changing environment
- Ability to add a new env from the extension

### Changed

- The Logo for the VS Code extension
- Changed the name from Display AWS Amplify Environment to AWS Amplify Enironment

## [1.0.1] - 2022-06-20

### Fixed

- the extension activation event was an event that looked for a ``team-provider-info.json`` file in the workspace at startup and if not found the extension would not activate. With this fix. The file system watcher detects the creation of the ``team-provider-info.json`` file and activates the extension.

## [1.0.2] - 2022-06-29

### Fixed

- The extension was not detecting the creation of the ``team-provider-info.json`` file.

### Removed

- Removed the tooltip for now (Don't know what to use it for right now, will figure it out)
