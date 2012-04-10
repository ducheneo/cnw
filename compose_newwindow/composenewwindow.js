/**
 * compose_newwindow - Compose(Reply/Forward) in a New Window
 *
 * @version 3.00 (20110822)
 * @author Karl McMurdo (user xrxca on roundcubeforum.net)
 * @url http://github.com/xrxca/cnw
 * @copyright (c) 2010-2011 Karl McMurdo
 *
 */ 

$(document).ready(function() {
  if (window.rcmail) {
    rcmail.addEventListener('init', function(evt) {
      rcmail.register_command('plugin.composenewwindow', composenewwindow, true);
      rcmail.register_command('plugin.replynewwindow', replynewwindow, true); 
      rcmail.register_command('plugin.reply-allnewwindow', replyallnewwindow, true);
      rcmail.register_command('plugin.reply-listnewwindow', replylistnewwindow, true);
      rcmail.register_command('plugin.composenewwindow', composenewwindow, true); 
      rcmail.register_command('plugin.forwardnewwindow', forwardnewwindow, true);
      rcmail.register_command('plugin.forward-attachmentnewwindow', forwardattachmentnewwindow, true);
      rcmail.register_command('plugin.abookcomposenewwindow', abookcomposenewwindow, true); 
      rcmail.addEventListener('plugin.composenewwindow_abooksend', abookcomposecallback);
      rcmail.addEventListener('plugin.composenewwindow_reload_messagelist', composenewwindow_reload_messagelist);
    });  
  }
});

function composenewwindow_reload_messagelist() {
  document.location.href='./';
}

function composenewwindow(emailaddr) {
    if (!rcmail) return(true);
    var url=rcmail.env.comm_path+"&_action=compose"; 
    url = rcmail.get_task_url('mail', url)+'&_to='+urlencode(emailaddr);
    rcmail.env.composenewwindow = opencomposewindow(url);
    return(false);
}

function replynewwindow(i) {
    if (!rcmail) return(true);
    var uid;
    if(uid=newwindow_contextuid(i)) {
        var url=rcmail.env.comm_path+"&_action=compose&_mbox="+urlencode(rcmail.env.mailbox)+"&_reply_uid="+uid;
        rcmail.env.composenewwindow = opencomposewindow(url);
    }
    return(false);
}

function replyallnewwindow(i) {
    if (!rcmail) return(true);
    var uid;
    if(uid=newwindow_contextuid(i)) {
        var url=rcmail.env.comm_path+"&_action=compose&_mbox="+urlencode(rcmail.env.mailbox)+"&_reply_uid="+uid+"&_all=1";
        rcmail.env.composenewwindow = opencomposewindow(url);
    }
    return(false);
}

function replylistnewwindow(i) {
    if (!rcmail) return(true);
    var uid;
    if(uid=newwindow_contextuid(i)) {
        var url=rcmail.env.comm_path+"&_action=compose&_mbox="+urlencode(rcmail.env.mailbox)+"&_reply_uid="+uid+"&_all=list";
        rcmail.env.composenewwindow = opencomposewindow(url);
    }
    return(false);
}

function forwardnewwindow(i) {
    if (!rcmail) return(true);
    var uid;
    if(uid=newwindow_contextuid(i)) {
        var url=rcmail.env.comm_path+"&_action=compose&_mbox="+urlencode(rcmail.env.mailbox)+"&_forward_uid="+uid;
        if (i != 'sub' && i != 'context' &&  rcmail.env.forward_attachment) {
	    url += '&_attachment=1';
	}
        rcmail.env.composenewwindow = opencomposewindow(url);
    }
    if ( i == 'sub' ) rcmail_ui.show_popupmenu('forwardmenu',false);
    return(false);
}

// For new builtin forward attachment
function forwardattachmentnewwindow(i) {
    if (!rcmail) return(true);
    var uid;
    if(uid=newwindow_contextuid(i)) {
        var url=rcmail.env.comm_path+"&_action=compose&_mbox="+urlencode(rcmail.env.mailbox)+"&_forward_uid="+uid;
        url += '&_attachment=1';
        rcmail.env.composenewwindow = opencomposewindow(url);
    }
    if ( i == 'sub' ) rcmail_ui.show_popupmenu('forwardmenu',false);
    return(false);
}

// for forwardattachment plugin
function forwardattnewwindow(id) {
    if (!rcmail) return(true);
    var url=rcmail.env.comm_path+"&_action=compose"; 
    url = rcmail.get_task_url('mail', url)+'&_id='+id;
    rcmail.env.composenewwindow = opencomposewindow(url);
    return(false);
}

function sendinvitationnewwindow(id, edit) {
    if (!rcmail) return(true);
    var url=rcmail.env.comm_path+"&_action=compose"; 
    url = rcmail.get_task_url('mail', url)+'&_attachics=1&_eid='+id + '&_edit='+edit;
    rcmail.env.composenewwindow = opencomposewindow(url);
    return(false);
}

function abookcomposenewwindow(i) {
	if (!rcmail) return(true);
	if(!rcmail.contact_list) return(true);
	var prev_sel = null;
	var prev_cid = rcmail.env.cid;
	if (i == 'context' ) {
		if (rcmail.env.cid) {
			if (!rcmail.contact_list.in_selection(rcmail.env.cid)) {
				prev_sel = rcmail.contact_list.get_selection();
				rcmail.contact_list.select(rcmail.env.cid);
			} else if (rcmail.contact_list.get_single_selection() == rcmail.env.cid) {
				rcmail.env.cid = null;
			} else {
				prev_sel = rcmail.contact_list.get_selection();
				rcmail.contact_list.select(rcmail.env.cid);
			}
		}
	}

	var selection = rcmail.contact_list.get_selection();
	if(selection.length) {
		rcmail.http_request('plugin.composenewwindow_abooksend', '_cid='+urlencode(selection.join(','))+'&_source='+urlencode(rcmail.env.source), true);
	}

	if (prev_sel) {
		rcmail.contact_list.clear_selection();
		for (var i in prev_sel)
			rcmail.contact_list.select_row(prev_sel[i],CONTROL_KEY);
	}
	rcmail.env.cid = prev_cid;
	return(false);
}

function abookcomposecallback(response) {
    var url = rcmail.env.comm_path+'&_action=compose';
    url = rcmail.get_task_url('mail', url)+'&_mailto='+response;
    rcmail.env.composenewwindow = opencomposewindow(url);
}

function opencomposewindow(url) {
    // Window gets centered (more or less)
    var W = 1100;
    var H = 600;
    if(screen.left)
      var sl = screen.left;
    else
      var sl = 0;
    if(screen.top)
      var st = screen.top;
    else
      var st = 0;    
    var L = ( screen.width - W ) / 2 + sl;
    var T = ( screen.height - H ) / 2 + st - 50;
    T = (T<st?st:T);
    L = (L<sl?sl:L);
    var childwin = window.open(url,'','width='+W+',height='+H+',top='+T+',left='+L);
    // fix Chrome issue with moveTo method
    if (! $.browser.webkit) {
        childwin.moveTo(L,T);
    }
    childwin.focus();
    // Give the child window a name so we can close it later
    childwin.name = 'rc_compose_child';
    return childwin;
}

function newwindow_contextuid(orig) {
    if ( orig == 'context' && $('#messagelist tbody tr.contextRow') && String($('#messagelist tbody tr.contextRow').attr('id')).match(/rcmrow([a-z0-9\-_=]+)/i))
       return RegExp.$1;
    return rcmail.get_single_uid();
}
