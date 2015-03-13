define('views/app_dashboard',
    ['core/l10n', 'linechart', 'core/requests', 'core/urls', 'core/utils'],
    function(l10n, linechart, requests, urls, utils) {

    var gettext = l10n.gettext;
    var api = urls.api.url;

    return function(builder, args) {
        builder.start('app_dashboard.html', {slug: args[0]}).done(function() {
            requests.get(
                api('per_app_totals', [args[0]])
            ).done(function(data) {
                if ($.isNumeric(data.installs.total)) {
                    var $installs = $('.total-val.installs');
                    $installs.text(
                        $installs.text() + ' ' + d3.format(',d')(data.installs.total)
                    ).show();
                }
            });

            linechart.createSparkLines(args[0]);
        });

        builder.z('type', 'root');
        builder.z('title', gettext('Loading...'));

        builder.onload('app-data', function(app) {
            builder.z('title', utils.translate(app.name));
        });
    };
});
