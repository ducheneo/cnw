<?php
/**
* compose_newwindow - Compose(Reply/Forward) in a New Window
*
* @version 2.01 (20100213)
* @author Karl McMurdo (user xrxca on roundcubeforum.net)
* @url http://github.com/xrxca/cnw
* @copyright (c) 2010 Karl McMurdo
*
*/
class compose_newwindow extends rcube_plugin
{
    private $rc;
    private $prefs;
    private $options = array('enabled', 'hidebar');

    function init()
    {   
        $this->rc = &rcmail::get_instance();;
        if ( $this->option('enabled') ) {
            if ( $this->rc->task != 'settings' && ( $this->rc->action == '' || $this->rc->action == 'show' ) ) {
                $this->include_script('composenewwindow.js');
            }
            // Hook the objects that may have mailto: links in them.
            foreach(array('messageheaders', 'messagebody', 'contactdetails') as $obj) {
                $this->add_hook("template_object_$obj", array($this, 'template_object'));
            }
            $this->add_hook('render_page', array($this, 'render_page'));
            $this->register_action('plugin.composenewwindow_abooksend', array($this, 'composenewwindow_abooksend'));
        }
        $this->add_hook('user_preferences', array($this, 'user_preferences'));
        $this->add_hook('save_preferences', array($this, 'save_preferences'));
        $this->add_texts('localization/', true);
    }
  
    function option($option) {
        $val = $this->rc->config->get('cnw_'.$option);
        if(!is_null($val)) return($val);
        // If we've already loaded the default, return it.
        $val = $this->prefs[$option];
        if(!is_null($val)) return($val); 
        // otherwise load the defaults (the idea here is that the plugin config 
        // file wont be read if the user has overriden the settings already.
        if ( file_exists($this->home.'/config.inc.php') ) {
            $this->load_config();        
        } else {
            $this->load_config('config.inc.php.dist');
        }
        foreach($this->options as $opt) {
            $val = $this->rc->config->get('cnw_'.$opt);
            if(is_null($val)) {
                $val = $this->rc->config->get('compose_newwindow_'.$opt, false);
            }
            $this->prefs[$opt] = $val;
        }
        return($this->prefs[$option]);
    }
    
    function render_page($args)
    {
        if ( ($args['template'] == "mail") || ($args['template'] == "message") ) {
            if ( $this->option('enabled') ) {
                $this->include_script("closewindow.js");
                $s = array(
                    "rcmail.command('compose'",
                    "rcmail.command('reply'",
                    "rcmail.command('reply-all'",
                    "rcmail.command('forward'",
                    );
                $r = array(
                    "rcmail.command('plugin.composenewwindow'",
                    "rcmail.command('plugin.replynewwindow'",
                    "rcmail.command('plugin.reply-allnewwindow'",
                    "rcmail.command('plugin.forwardnewwindow'",
                    );
                $args['content'] = str_replace($s, $r,$args['content']);
            }
        } elseif ( ($args['template'] == "addressbook")) {
            if ( $this->option('enabled') ) {
                if ( ! $this->option('hidebar') ) {
                    $this->include_script("closewindow.js");
                }
                $s = array(
                    "rcmail.command('compose'",
                    );
                $r = array(
                    "rcmail.command('plugin.abookcomposenewwindow'",
                    );
                $args['content'] = str_replace($s, $r,$args['content']);
            }
        } elseif ( ($args['template'] == "compose") ) {
            if ( $this->option('enabled') ) {
                if ( $this->option('hidebar') ) {
                    $cssfile = 'skins/' . $this->rc->config->get('skin') . '/compose.css';
                    if (!is_file(realpath(slashify($this->home) . $cssfile)))
                        $cssfile = 'skins/default/compose.css';
                    $this->include_stylesheet($cssfile);
                }
            }
        } elseif ( $this->option('enabled') && ! $this->option('hidebar')) {
            $this->include_script("closewindow.js");
        }
        return($args);
    }
    
    function template_object($args) {
        $s = array(
            "rcmail.command('compose'",
            );
        $r = array(
            "rcmail.command('plugin.composenewwindow'",
            );
        $args['content'] = str_replace($s, $r,$args['content']);
        return($args);
    }
    
    function add_checkbox(&$args, $option, $extra = '')
    {
        $config_name = 'cnw_' . $option;
        $field_name = '_' . $config_name;
        $field_id = 'rcmfd_cnw_' . $option;
        if ($extra !== '') $extra = '&nbsp;&nbsp;' . Q($extra);
        $checkbox = new html_checkbox(array('name' => $field_name, 'id' => $field_id, 'value' => 1));
        $args['blocks']['compose_newwindow']['options'][$config_name] = array(
            'title' => html::label($field_id, Q($this->gettext($option))), 
            'content' => $checkbox->show($this->option($option)) . $extra, );
    }

    function user_preferences($args)
    {
        if ($args['section'] == 'compose') {
            // Add new block
            $args['blocks']['compose_newwindow']['name'] = $this->gettext('compose_newwindow');
            // Add checkboxes
            $this->add_checkbox($args, 'enabled');
            $this->add_checkbox($args, 'hidebar');
        }
        return $args;
    }
    function save_preferences($args)
    {
        if ($args['section'] == 'compose') {
            foreach($this->options as $option) {
                $args['prefs']['cnw_' . $option] = isset($_POST['_cnw_' . $option]) ? true : false;
            }
        }
        return $args;
    }
    function composenewwindow_abooksend() {
        $cid = get_input_value('_cid', RCUBE_INPUT_GET);
        $recipients = null;
        $mailto = array();
        $CONTACTS = $this->rc->get_address_book(null, true);
        if ($cid && preg_match('/^[a-z0-9\-\+\/_=]+(,[a-z0-9\-\+\/_=]+)*$/i', $cid))
        {
            $CONTACTS->set_page(1);
            $CONTACTS->set_pagesize(100);  // not sure about this
            $recipients = $CONTACTS->search($CONTACTS->primary_key, $cid);
            while (is_object($recipients) && ($rec = $recipients->iterate()))
            $mailto[] = format_email_recipient($rec['email'], $rec['name']);
        }
        if (!empty($mailto))
        {
            $mailto_str = join(', ', $mailto);
            $mailto_id = substr(md5($mailto_str), 0, 16);
            $_SESSION['mailto'][$mailto_id] = urlencode($mailto_str);
            $this->rc->output->command('plugin.composenewwindow_abooksend', $mailto_id);
        } else {
            $this->rc->output->command('plugin.composenewwindow_abooksend', '');
        }
    }
}

?>