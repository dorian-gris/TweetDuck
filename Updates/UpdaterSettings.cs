﻿namespace TweetDuck.Updates{
    sealed class UpdaterSettings{
        public bool AllowPreReleases { get; set; }
        public string? DismissedUpdate { get; set; }
        public string InstallerDownloadFolder { get; set; }
    }
}
