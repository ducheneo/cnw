/**
 * compose_newwindow - Compose(Reply/Forward) in a New Window
 *
 * @version 1.02 (20100210)
 * @author Karl McMurdo (user xrxca on roundcubeforum.net)
 * @url http://github.com/xrxca/cnw
 * @copyright (c) 2010 Karl McMurdo
 *
 */ 

// Try opening a new window if our name is wrong, this 
// has some real issues with popup blockers, need to look
// into the mailto: link handling in roundcube
if (self.window.name != 'rc_compose_child' ){
    if (rcmail) {
	// Window gets centered (more or less)
	var W = 1100;
	var H = 600;
	var L = ( screen.width - W ) / 2 + screen.left;
	var T = ( screen.height - H ) / 2 + screen.top - 50;
	T = (T<screen.top?screen.top:T);
	L = (L<screen.left?screen.left:L);
	var childwin = window.open(rcmail.env.comm_path+"&_action=compose&_mbox="+urlencode(rcmail.env.mailbox),'','width='+W+',height='+H+',top='+T+',left='+L);
	// Give the child window a name so we can close it later
	childwin.name = 'rc_compose_child';
        history.go(-1);
    }
}
