define('views/apps_installed',
    ['chartutils', 'core/l10n'],
    function(cutils, l10n) {

    var gettext = l10n.gettext;

    // Easy way to toggle regions for this view.
    var enableRegions = true;

    return function(builder) {
        // L10n: This is the title of a chart representing the number of apps installed split by region.
        var chartTitle = gettext('Apps Installed');
        var context = {title: chartTitle};
        context.enableRegions = enableRegions;

        builder.start('apps_chart.html', context).done(function() {
            cutils.createChart(
                'apps_installed',
                gettext('Apps'),
                gettext('Number of Apps'),
                {
                    dropNulls: false, // Treat nulls as zeros.
                    noregion: !enableRegions
                }
            );
        });

        builder.z('type', 'root');
        builder.z('title', chartTitle);
    };
});
