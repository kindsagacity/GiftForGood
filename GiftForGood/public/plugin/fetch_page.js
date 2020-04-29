let controls = null;
let current_control_index = 0;
let capture_value_id = null;

$.fn.bindFirst = function (name, fn) {
    this.on(name, fn);
    this.each(function () {
        var handlers = $._data(this, 'events')[name.split('.')[0]];
        var handler = handlers.pop();
        handlers.splice(0, 0, handler);
    });
};

$(document).ready(function () {
    addPanelHTML();

    $('#ce-btn-signin').click(function () {
        $('.ce-login-status').addClass('d-none');
        let login_email = $('#ce-login-email').val();
        let login_password = $('#ce-login-password').val();
        let url = 'http://66.42.58.23:8880/secret/login';
        let data = {
            login_email: login_email,
            login_password: login_password,
        };
        $.ajax({
            url: url,
            method: 'post',
            data: data,
            success: function (res) {
                if (res.status === 'success') {
                    let token = res.token;
                    localStorage.setItem('token', token);
                    localStorage.setItem('login_email', login_email);
                    gotoMainPanel();
                    getMasterControls();
                } else {
                    $('.ce-login-status').html(res.message);
                    $('.ce-login-status').removeClass('d-none');
                }
            }
        })
    });

    $('.ce-btn-logout').click(function () {
        let token = localStorage.getItem('token');
        let url = 'http://66.42.58.23:8880/api/logout_token';
        $.ajax({
            url: url,
            method: 'post',
            headers: {"Authorization": `Bearer ${token}`},
            success: function (res) {
                if (res.status === 'success') {
                    gotoLoginPanel();
                }
            }
        });
    });

    $('.ce-btn-hide').click(function () {
        $("#ce-clickfunnels-main-panel").dialog('close');
    });

    $('.ce-btn-update').click(function () {
        let token = localStorage.getItem('token');
        if (token) {
            let page_id = $('#ce-page-id').val();
            let page_name = $('#ce-page-name').val();
            let login_email = localStorage.getItem('login_email');
            let url = 'http://66.42.58.23:8880/api/save_result';
            let data = {
                login_email: login_email,
                page_id: page_id,
                page_name: page_name,
                controls: controls,
            };
            $.ajax({
                url: url,
                method: 'post',
                data: data,
                headers: {"Authorization": `Bearer ${token}`},
                success: function (res) {
                    if (res.status === 'success') {
                        let page_name = res.data.page_name;
                        let controls_url = res.data.controlsUrl;
                        let message = res.data.message;
                        $('#ce-final-page-name').val(page_name);
                        $('#ce-final-control-url').val(controls_url);
                        $('.ce-final-message').html(message);
                        gotoFinalPanel();
                    }
                }
            });
        }
    });

    $('.ce-btn-refresh').click(function () {
        $('#ce-info').empty();
        getMasterControls();
        gotoMainPanel();
    });

    $('.ce-btn-back').click(function () {
        gotoMainPanel();
    });

    $('#ce-btn-help').click(function () {
        alertHelp($(this).attr('title'));
    });

    $('#ce-btn-video').click(function () {
        alertVideo($(this).attr('title'));
    });

    $(document).on('keydown', function (event) {
        if (event.key === "Escape") {
            $('*').off('click', block);
            $('.ce-btn-capture').attr('disabled', false);
            $('*').css('cursor', 'default');
        }
    });

    $('#ce-control-list').on('change', function () {
        changedControlIndex(this.value);
    });

    checkLogin();
});

function addPanelHTML() {
    let content = '';
    content += '<div id="ce-clickfunnels-main-panel" title="Clickfunnels AIL Tools" style="display: none;background: rgba(0,0,0,.9) !important; font-size: 12px;">';
    /***************************** Login Panel *****************************/
    content += '<div id="ce-login-panel" style="margin-top: 1.5rem; width: 30rem;">';
    content += '<label class="lbl-disp" style="display: block; margin-bottom: .4rem;">Email : </label>';
    content += '<input type="text" class="form-control" style="display: inline-block; margin-bottom: 1rem; color: #ddd; background: transparent !important;" id="ce-login-email" />';
    content += '<label class="lbl-disp" style="display: block; margin-bottom: .4rem;">Password : </label>';
    content += '<input type="text" class="form-control" style="display: inline-block; margin-bottom: 1rem; color: #ddd; background: transparent !important;" id="ce-login-password" />';

    content += '<div class="ce-login-status d-none" style="color: red;"></div>';

    content += '<div style="display: flex; margin: .5rem;">';
    content += '<div style="flex: 1;"></div>';
    content += '<button class="ext-btn-control" id="ce-btn-signin">SignIn</button>';
    content += '<button class="ext-btn-control" id="ce-btn-signup">SignUp</button>';
    content += '</div>';
    content += '</div>';
    /***************************** Main Panel *****************************/
    content += '<div id="ce-main-panel" class="d-none" style="width: 45rem;">';

    content += '<div style="margin-top: 1.5rem; margin-left: 1rem;">';
    content += '<label class="lbl-disp">Page ID: </label>';
    content += '<input type="text" class="form-control" style="display: inline-block; width: 12rem; margin-right: 2rem;color: #ddd; background: transparent !important;" readonly id="ce-page-id" />';
    content += '<label class="lbl-disp">Page Name: </label>';
    content += '<input type="text" class="form-control" style="display: inline-block; width: 12rem;color: #ddd; background: transparent !important;" readonly id="ce-page-name" />';
    content += '</div>';

    content += '<div style="margin-top: 1.5rem; margin-left: 1rem;">';
    content += '<label class="lbl-disp" style="display: block; margin-bottom: .4rem;">Controls</label>';
    content += '<div style="display: flex;">';
    content += '<select class="form-control" id="ce-control-list" style="display: inline-block; width: 20rem; background: transparent !important;color: #ddd;border: 1px solid rgb(206, 212, 218) !important;">';
    content += '</select>';
    content += '<button class="ext-btn-hint help" id="ce-btn-help" title="Help Test..."></button>';
    content += '<button class="ext-btn-hint video" id="ce-btn-video" title="Video Test..."></button>';
    content += '</div>';
    content += '</div>';

    content += '<div style="margin-top: 1.5rem; margin-left: 1rem;">';
    content += '<label class="lbl-disp" style="display: block; margin-bottom: .4rem;">Attributes</label>';

    content += '<div id="ce-attribute-list">';
    content += '</div>';

    content += '<label class="lbl-disp" style="margin-left: 5rem; margin-top: .6rem;">Press ESC to release</label>';
    content += '</div>';

    content += '<div style="display: flex; margin-top: .7rem;">';
    content += '<button class="ext-btn-control ce-btn-logout" >Logout</button>';
    content += '<div style="flex: 1;"></div>';
    content += '<button class="ext-btn-control ce-btn-hide">Hide</button>';
    content += '<button class="ext-btn-control ce-btn-update">Update</button>';
    content += '<button class="ext-btn-control ce-btn-refresh">Refresh</button>';
    content += '</div>';
    content += '</div>';
    /***************************** Final Panel *****************************/
    content += '<div id="ce-final-panel" class="d-none" style="width: 30rem;">';
    content += '<label class="lbl-disp" style="display: block; margin-bottom: .4rem;">Page Name : </label>';
    content += '<input type="text" class="form-control" style="display: inline-block; margin-bottom: 1rem; margin-right: 1rem;color: #ddd; background: transparent !important;" readonly id="ce-final-page-name" />';
    content += '<label class="lbl-disp" style="display: block; margin-bottom: .4rem;">Control URL : </label>';
    content += '<input type="text" class="form-control" style="display: inline-block; margin-bottom: 1rem; margin-right: 1rem;color: #ddd; background: transparent !important;" readonly id="ce-final-control-url" />';

    content += '<div class="ce-final-message" style="color: yellow;"></div>';

    content += '<div style="display: flex; margin-top: 2rem;">';
    content += '<button class="ext-btn-control ce-btn-logout">Logout</button>';
    content += '<div style="flex: 1;"></div>';
    content += '<button class="ext-btn-control ce-btn-back">Back</button>';
    content += '<button class="ext-btn-control ce-btn-hide">Hide</button>';
    content += '<button class="ext-btn-control ce-btn-refresh">Refresh</button>';
    content += '</div>';
    content += '</div>';

    content += '</div>';

    let help_modal_content = '';
    help_modal_content += '<div id="ce-help-panel" title="Help" style="display: none;background: rgba(0,0,0,.9) !important; z-index: 999999;font-size: 14px;">';
    help_modal_content += '<p id="ce-help-content" style="color: yellow; width: 35rem;"></p>';
    help_modal_content += '</div>';

    let video_modal_content = '';
    video_modal_content += '<div id="ce-video-panel" title="Video" style="display: none;background: rgba(0,0,0,.9) !important; z-index: 999999;font-size: 14px;">';
    video_modal_content += '<iframe width="420" height="315" src="https://www.youtube.com/embed/tgbNymZ7vqY?playlist=tgbNymZ7vqY&loop=1"></iframe>';
    video_modal_content += '</div>';

    $('body').append(content);
    $('body').append(help_modal_content);
    $('body').append(video_modal_content);
}

function checkLogin() {
    let token = localStorage.getItem('token');
    let url = 'http://66.42.58.23:8880/api/check_token';
    $.ajax({
        url: url,
        method: 'post',
        headers: {"Authorization": `Bearer ${token}`},
        success: function (res) {
            if (res.status === 'success') {
                gotoMainPanel();
                getMasterControls();
            } else {
                gotoLoginPanel();
            }
        }
    });
}

function gotoLoginPanel() {
    $('#ce-login-panel').removeClass('d-none');
    $('#ce-final-panel').addClass('d-none');
    $('#ce-main-panel').addClass('d-none');

    try {
        $("#ce-clickfunnels-main-panel").dialog({
            resizable: false,
            width: 'auto'
        });

        $('.ui-dialog.ui-corner-all.ui-widget.ui-widget-content.ui-front.ui-draggable').position({
            my: "right top",
            at: "right top",
            of: window
        });
    } catch (e) {
        setTimeout(function () {
            gotoLoginPanel();
        }, 2000);
    }
}

function gotoMainPanel() {
    $('#ce-login-panel').addClass('d-none');
    $('#ce-final-panel').addClass('d-none');
    $('#ce-main-panel').removeClass('d-none');

    try {
        $("#ce-clickfunnels-main-panel").dialog({
            resizable: false,
            width: 'auto'
        });

        $('.ui-dialog.ui-corner-all.ui-widget.ui-widget-content.ui-front.ui-draggable').position({
            my: "right top",
            at: "right top",
            of: window
        });
    } catch (e) {
        setTimeout(function () {
            gotoMainPanel();
        }, 2000);
    }
}

function gotoFinalPanel() {
    $('#ce-login-panel').addClass('d-none');
    $('#ce-final-panel').removeClass('d-none');
    $('#ce-main-panel').addClass('d-none');

    try {
        $("#ce-clickfunnels-main-panel").dialog({
            resizable: false,
            width: 'auto'
        });

        $('.ui-dialog.ui-corner-all.ui-widget.ui-widget-content.ui-front.ui-draggable').position({
            my: "right top",
            at: "right top",
            of: window
        });
    } catch (e) {
        setTimeout(function () {
            gotoFinalPanel();
        }, 2000);
    }
}

function alertHelp(msg) {
    $('#ce-help-content').html(msg);
    $("#ce-help-panel").dialog({
        resizable: false,
        draggable: false,
        width: 'auto',
        modal: true
    });
}

function alertVideo(url) {
    $("#ce-video-panel").dialog({
        resizable: false,
        draggable: false,
        width: 'auto',
        modal: true
    });
}

function FetchPageId(dom) {
    /* In this part, will analyze dom and will return page_id */
    if (isNode(dom)) {
        let oHead = $(dom).find('head');
        let idNum = $(oHead).attr('data-lander-id');
        if (typeof idNum === "undefined") idNum = 12121;
        let nameDesc = $(oHead).find('title').text();
        return {id: idNum, name: nameDesc};
    }
    return {id: 12121, name: "Dummy Object"};
}

function FetchAttribute(dom, object) {
    if (typeof object === undefined) return 'novalue';
    return $(object).attr('id');
}

//Returns true if it is a DOM node
function isNode(o) {
    return (
        typeof Node === "object" ? o instanceof Node :
            o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
    );
}

function getMasterControls() {
    let token = localStorage.getItem('token');
    if (token) {
        let page_data = FetchPageId(document);
        let page_id = page_data.id;
        let page_name = page_data.name;
        $('#ce-page-id').val(page_id);
        $('#ce-page-name').val(page_name);
        $('#ce-control-list').empty();

        let url = 'http://66.42.58.23:8880/api/get_master_controls';
        $.ajax({
            url: url,
            method: 'post',
            headers: {"Authorization": `Bearer ${token}`},
            success: function (res) {
                if (res.status === 'success') {
                    console.log(res.data);
                    controls = res.data;

                    for (let i = 0; i < controls.length; i++) {
                        let control = controls[i];
                        let control_option_tag = `<option value="${i}" style="color: #2b2b2b;">${control.control_name}</option>`;
                        $('#ce-control-list').append(control_option_tag);
                    }
                    changedControlIndex(0);
                }
            }
        });
    }
}

let block = function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();

    $('.ce-btn-capture').attr('disabled', false);
    $('*').css('cursor', 'default');

    let fetch_attribute_value = FetchAttribute(document, this);

    $('#' + capture_value_id).val(fetch_attribute_value);
    controls[current_control_index].attributes.find(x => x.attribute_id == capture_value_id).value = fetch_attribute_value;

    $('*').off('click', block);
};

function changedControlIndex(index) {
    current_control_index = index;

    let help = controls[index].help_text;
    let video_link = controls[index].video_url;
    $('#ce-btn-help').attr('title', help);
    $('#ce-btn-video').attr('title', video_link);

    $('#ce-attribute-list').empty();
    let attributes = controls[index].attributes;
    for (let i = 0; i < attributes.length; i++) {
        let attribute = attributes[i];
        let predefined_values = attribute.predefined_values;
        if (predefined_values == null) {
            let attribute_tag = '<div style="margin: .4rem;">';
            attribute_tag += '<label class="lbl-disp">' + attribute.attribute_name + ' : </label>';
            attribute_tag += '<input type="text" id="' + attribute.attribute_id + '" readonly class="form-control" style="display: inline-block; width: 15rem;background: transparent !important;color: #ddd;border: 1px solid rgb(206, 212, 218) !important;" value="' + attribute.value + '"/>';
            attribute_tag += '<button class="ext-btn-control ext-btn-hint ce-btn-capture" id="' + attribute.attribute_id + "-capture" + '" style="margin-left: 1rem;vertical-align: middle;" title="Capture Element"></button>';
            attribute_tag += '</div>';
            $('#ce-attribute-list').append(attribute_tag);
        } else {
            let attribute_tag = '<div style="margin: .4rem;">';
            attribute_tag += '<label class="lbl-disp">' + attribute.attribute_name + ' : </label>';
            attribute_tag += '<select id="' + attribute.attribute_id + '" class="form-control ce-attribute-predefined" style="display: inline-block; width: 15rem;background: transparent !important;color: #ddd;border: 1px solid rgb(206, 212, 218) !important;">';
            for (let k = 0; k < predefined_values.length; k++) {
                attribute_tag += '<option value="' + predefined_values[k] + '" style="color: #2b2b2b;">' + predefined_values[k] + '</option>';
            }
            attribute_tag += '</select>';
            attribute_tag += '</div>';
            $('#ce-attribute-list').append(attribute_tag);
            $('#' + attribute.attribute_id).val(attribute.value);
        }
    }

    $('.ce-btn-capture').click(function (event) {
        event.preventDefault();
        event.stopPropagation();

        $('*').css('cursor', 'crosshair');
        $('.ce-btn-capture').attr('disabled', true);

        capture_value_id = this.id;
        capture_value_id = capture_value_id.replace("-capture", "");

        $('*').bindFirst('click', block);
    });

    $('.ce-attribute-predefined').on('change', function () {
        let attribute_select_id = this.id;
        let attribute_select_value = this.value;
        attribute_select_id = attribute_select_id.replace("-capture", "");
        controls[current_control_index].attributes.find(x => x.attribute_id == attribute_select_id).value = attribute_select_value;
    });
}