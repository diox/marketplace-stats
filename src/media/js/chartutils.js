define('chartutils',
    ['core/notification', 'core/urls', 'core/user', 'core/utils', 'core/z',
     'linechart', 'utils_local', 'underscore'],
    function(notification, urls, user, utils, z,
             linechart, ml, _) {

    // Get last `dayrange` days when no chart date range specified.
    var dayrange = 30;
    var interval = 'day';
    var start = ml.getRecentTimeDelta(dayrange).start;
    var end = ml.getRecentTimeDelta(dayrange).end;
    var region = null;
    var params = utils.getVars();
    var doRedirect = false;
    var ask = notification.confirmation;
    var notify = notification.notification;
    // Better x-axis for short day ranges (number of days).
    var shortDelta = 15;

    var strings = {
        errors: {
            500: gettext('Server error detected. Please try again later.'),
            404: gettext('The statistics endpoint requested is invalid.'),
            403: gettext('Authentication failure detected. The data you are trying to access is not public.'),
            400: gettext('The statistics data request is incomplete or invalid.'),
            unknown: gettext('An unknown server error was detected. Please try again later.')
        },
        prompts: {
            reverseDates: gettext('You have entered a negative date range. Reverse?'),
            validDate: gettext('Please enter a valid date range')
        }
    };

    // Use range url params if found.
    if ('start' in params && 'end' in params) {
        start = params.start;
        end = params.end;
        if ('region' in params) {
            region = params.region;
        }
    } else {
        doRedirect = true;
    }

    // Use interval url param if found.
    if ('interval' in params) {
        interval = params.interval;
    }

    // Sets the date range in the 'to' and 'from' inputs.
    function updateRange($rng, start, end) {
        $rng.eq(0).val(start);
        $rng.eq(1).val(end);
    }

    // Sets the active interval link.
    function updateInterval() {
        $('.interval li').removeClass('active');
        $('.interval [data-interval=' + interval + ']').closest('li').addClass('active');
    }

    // lblValue...remember Visual Basic?
    // Optional args: opts, slug
    function createChart(apiName, lblValue, lblYAxis, opts, slug) {
        if (opts && opts.noregion) {
            region = null;
        }

        var newURL = ml.getNewURL(apiName, start, end, interval, region, slug);
        var options = {};
        var $range = $('#range x-datepicker');
        var $regions = $('.regions select');

        // Avoid event leaks.
        z.page.off('submit.range');
        $regions.off('change.updateregion');
        z.page.off('click.interval');

        if (opts && !opts.noregion) {
            var $icon = $('.regions em');
            $icon.removeClass().addClass(region);
            $regions.on('change.updateregion', function() {
                region = this.value;
                $icon.removeClass().addClass(region);
                newURL = ml.getNewURL(apiName, start, end, interval, region, slug);
                z.page.trigger('divert', [newURL]);
            }).find('option[value="' + region + '"]').prop('selected', true);
        }

        if (doRedirect) {
            // Prevent redirect loops - also a terrible breakfast cereal.
            doRedirect = false;
            z.page.trigger('divert', [newURL]);
            window.history.replaceState({}, '', newURL);
            return;
        }

        if (isNegativeRange(start, end)) {
            ask({
                message: strings.prompts.reverseDates,
                closable: true
            }).then(function() {
                end = $range.eq(0).val();
                start = $range.eq(1).val();
                updateRange($range, start, end);
                z.page.trigger(
                    'divert',
                    [ml.getNewURL(apiName, start, end, interval, region, slug)]
                );
            });
        } else if (start == end) {
            notify({message: strings.prompts.validDate});
        }

        window.history.replaceState({}, '', newURL);

        var params = {
            'start': start,
            'end': end,
            'interval': interval
        };
        if (region) {
            params.region = region;
        }

        if (opts && opts.noregion) {
            // We don't need to send this flag further.
            delete opts.noregion;
        }

        // Slug provided. Per app stats URLs are constructed differently.
        // options.url is the API endpoint. newURL is the current path.
        if (slug) {
            options = {url: urls.api.url(apiName, [slug], params)};
        } else {
            options = {url: urls.api.params(apiName, params)};
        }

        // Override options from opts argument if any.
        for (var prop in opts) {
            options[prop] = opts[prop];
        }

        // Sets link for "download as JSON".
        $('#raw-json').attr('href', options.url);

        options.shortRange = isShortRange(start, end);

        // Create the actual chart.
        linechart.createLineChart({
            tooltipValue: lblValue,
            yAxis: lblYAxis,
            strings: strings
        }, options);

        // あくま
        updateRange($range, start, end);

        updateInterval();

        z.page.on('submit.range', '#rangeform', utils._pd(function() {
            start = $range.eq(0).val();
            end = $range.eq(1).val();

            createChart(apiName, lblValue, lblYAxis, opts, slug);
        }));

        z.page.on('click.interval', '.interval a', function() {
            interval = $(this).data('interval');

            createChart(apiName, lblValue, lblYAxis, opts, slug);
        });
    }

    function isShortRange(start, end) {
        var aStart = start.split('-');
        var aEnd = end.split('-');
        var delta = 0;

        // Can't call .apply() on `Date`. This would be a cruel interview question.
        start = new Date(aStart[0], aStart[1], aStart[2]);
        end = new Date(aEnd[0], aEnd[1], aEnd[2]);
        delta = d3.time.day.range(start, end).length;

        return (delta > 0) && (delta < shortDelta);
    }

    function isNegativeRange(start, end) {
        var aStart = start.split('-');
        var aEnd = end.split('-');

        start = new Date(aStart[0], aStart[1], aStart[2]);
        end = new Date(aEnd[0], aEnd[1], aEnd[2]);

        return (start - end) > 0;
    }

    return {
        'createChart': createChart,
    };
});
