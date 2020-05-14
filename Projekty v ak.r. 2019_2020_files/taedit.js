// Copyright (C) 2003,2008 Petr Lampa 
// No part of this source can be used without permission.
// $Id: taedit.js 4203 2019-02-21 20:04:39Z lampa $
// vi:set ts=8 sts=4 sw=4:

var Browser = window.navigator.userAgent;
var mozilla_version=0;
var msie_version=0;
var gecko_version=0;
var opera_version=0;
var edge_version=0;
var chrome_version=0;
var editboxes = [];
var editbuttons = [];

function getSel(editbox)
{
	var r;
	if (msie_version) {
		r = editbox.doc.selection.createRange();
		return r;
	}
	r = editbox.iframe_obj.contentWindow.getSelection();
	if (typeof r != 'undefined') return r.getRangeAt(0);
	return '';
}

function FilterHTML(str, dofin)
{
/* delete with content */
    var re4 = /<style[^>]*>.*<\/style>/im;
    while (re4.test(str)) str = str.replace(re4, '');
    var re5 = /<script[^>]*>.*<\/script>/im;
    while (re5.test(str)) str = str.replace(re5, '');
    var re = /<\/?([a-zA-Z]+)((?:[^'">]*|'[^']*'|"[^"]*")*)>/g;
    var retend = [];
/* delete not allowed tags */
    str = str.replace(re, function(match, tag, attrs) 
	{
	    var ret = '';
	    var endtag = (match.charAt(1) == '/');
	    tag = tag.toLowerCase();
	    if (endtag && tag == 'span' && retend.length) {
		ret = retend.pop();
	    } else
	    if (tag == 'b' || tag == 'strong' || tag == 'span' && attrs.indexOf('bold') > 0) {
		if (endtag) ret = '</b>';
		else {
		    ret = '<b>';
		    if (tag == 'span') retend.push('</b>');
		}
	    } else
	    if (tag == 'i' || tag == 'em' || tag == 'span' && attrs.indexOf('italic') > 0) {
		if (endtag) ret = '</i>';
		else {
		    ret = '<i>';
		    if (tag == 'span') retend.push('</i>');
		}
	    } else
	    if (tag == 'u' || tag == 'span' && attrs.indexOf('underline') > 0) {
		if (endtag) ret = '</u>';
		else {
		    ret = '<u>';
		    if (tag == 'span') retend.push('</u>');
		}
	    } else
	    if (tag == 's' || tag == 'span' && attrs.indexOf('line-through') > 0) {
		if (endtag) ret = '</s>';
		else {
		    ret = '<s>';
		    if (tag == 'span') retend.push('</s>');
		}
	    } else
	    if (tag == 'span') {
		ret = '';
		if (!endtag) retend.push('');
	    } else
	    if (tag == 'tt') {
		if (endtag) ret = '</tt>';
		else ret = '<tt>';
	    } else
	    if (tag == 'li' || tag == 'ul' || tag == 'ol' || tag == 'pre' || tag == 'br' || tag == 'tt' || tag == 'bod') {
		if (endtag) ret = '</'+tag+'>';
		else ret = '<'+tag+'>';
	    } else
	    if (tag == 'p' || tag == 'div') {
		if (endtag) ret = '</'+tag+'>';
		else { 
		    ret = '<'+tag;
		    if (attrs.indexOf('left') > 0) {
			ret = ret + ' align=left>';
		    } else
		    if (attrs.indexOf('center') > 0) {
			ret = ret + ' align=center>';
		    } else
		    if (attrs.indexOf('right') > 0) {
			ret = ret + ' align=right>';
		    } else {
			ret = ret + '>';
		    }
		}
	    } else
	    if (tag == 'a') {
		if (endtag) ret = '</a>';
		else {
		    var href = /^\s*href=["'][^'"]+["']\s*$/i;
		    if (href.test(attrs)) ret = '<a '+attrs+'>';
		}
	    } else 
	    if (tag == 'img') {
		var src = /^(\s*(src|alt)=["'][^'"]*["'])+\s*$/i;
		if (src.test(attrs)) ret = '<img '+attrs+'>';
	    } 
	    return ret;
	}
	);
    /* remove empty tags */
    var re = /<[^>\/]+>\s*<\/[^>]+>/gi;
    while (re.test(str)) str = str.replace(re, '');
    /* remove Word xml PI */
    var re2 = /<\?xml[^>]+>/gi;
    while (re2.test(str)) str = str.replace(re2, '');
/* chrome - replace <div>line</div> */
    var re3 = /<div>(.*?)<\/div>/im;
    while (re3.test(str)) str = str.replace(re3, '<br>$1'); 
    str = str.replace(/^\s*<div>\s*/i, '');
    str = str.replace(/\s*<div>\s*$/i, '');
/*    str = str.replace(/&#[0-9]+;/g, ''); */
    str = str.replace(/^\s*<p>\s*/i, '');	
    str = str.replace(/\s*<\/p>\s*$/i, '');	
    str = str.replace(/^\s*<br>\s*$/i, '');
    str = str.replace(/<\/b><b>|<\/i><i>|<\/u><u>/gi, '');
    if (dofin) {
	str = str.replace(/&lt;img/gi, '<img');
	str = str.replace(/&gt;/g, '>');
//	str = str.replace(/&amp;/g, '&');
    }
    return str;
}

function InitIframe(editbox)
{
	var str;
	if (editbox.iframe_obj.contentDocument) editbox.doc = editbox.iframe_obj.contentDocument; // NS6
	else
	if (editbox.iframe_obj.contentWindow) editbox.doc = editbox.iframe_obj.contentWindow.document; // IE6
	else editbox.doc = editbox.iframe_obj.document;
	if (editbox.iframe_obj.readyState == "loading" || editbox.doc == null) {
		if (gecko_version > 0) {
			setTimeout(InitIframe, 100, editbox);
			return false;
		}
	}
	str = editbox.textarea_orig.value;
	if (str.indexOf("<BOD>") != -1 || str.indexOf("<bod>") != -1) {
		str = "<ul>"+str.replace(/\<bod\>/gi, "<li>")+"</ul>";
	}
/*	str = str.replace(/&#([0-9A-Za-z]+);/g, '&amp;#$1;'); */
	str = str.replace(/\<img/gi, '&lt;img');
	if (str.indexOf("%7E") != -1) {
		str = str.replace(/%7E/g, "~");
	}
	str = FilterHTML(str, 0);
	editbox.doc.open("text/html", "replace");
	editbox.doc.write('<html><head><style>body { margin: 2px; font-family: Verdana,Geneva,Arial,sans-serif; font-size: 13px; }</style></head><body>'+str+'</body></html>');
	editbox.doc.close();
	var img = editbox.doc.getElementsByTagName('img');
	for (var i = 0; i < img.length; i++) {
	    img[i].onclick = editbox_img;
	}
	if (gecko_version > 0) {
		editbox.doc.designMode = 'on';
		/*editbox.doc.body.ondrop = editbox_drop; */
		editbox.doc.execCommand('useCSS', false, true);	
		editbox.doc.execCommand('defaultParagraphSeparator', false, 'br');	
		editbox.doc.execCommand('styleWithCSS', false, false);	
		UpdateButtons(editbox, '');
		editbox.doc.body.onkeydown = editbox_press;
	} else {
		editbox.doc.body.contentEditable = true;
	}
	editbox.doc.body.onclick = function() { UpdateButtons(editbox, ''); };
}
function editbox_drop(e)
{
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length &&
        e.dataTransfer.files[0].type.match(/^image\//)) {
        var t = e.target;
        e.preventDefault();
        e.stopPropagation();
        xhr = new XMLHttpRequest();
        fd = new FormData();
        fd.append('upload_file', e.dataTransfer.files[0]);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    var res = JSON.parse(xhr.responseText);
                    var img = document.createElement('img');
                    img.src = res.location;
                    t.appendChild(img);
                } else {
                    alert('error');
                }
            }
        }
	var path = window.location.pathname.split('/');
	var url = 'https://wis.fit.vutbr.cz/'+path[0]+'/'+path[1]+'/imgrep.php';
        xhr.open("POST", url, true);
        xhr.send(fd);
        return false;
    }
    return true;
}
function editbox_img(e)
{
    var img = e.target;
    var url = prompt('URL (http://www.../...jpg)', img.src);
}
function editbox_resize(editbox, diff)
{
	var new_height = parseInt(editbox.iframe_obj.style.height) + diff;
	if (new_height < 100) new_height = 100;
	editbox.iframe_obj.style.height = new_height+'px';
	editbox.textarea_orig.style.height = new_height+'px';
}
function editbox_bmover()
{
	this.style.borderStyle = 'outset';
}
function editbox_bmout()
{
	if (this.style.borderBottomColor == '#c0c0c0' || this.style.borderBottomColor == 'rgb(192, 192, 192)') this.style.borderStyle = 'solid';
	else this.style.borderStyle = 'inset';
}
function editbox_press(e)
{
    if (e.ctrlKey && e.key) {
	if (e.key == 'b' || e.key == 'i' || e.key == 'u') {
	    var cmd;
	    if (e.key == 'b') cmd = 'bold';
	    else
	    if (e.key == 'i') cmd = 'italic';
	    else cmd = 'underline';
	    var doc = this.parentNode.parentNode;
	    this.focus();
	    doc.execCommand(cmd, false, null);
	    e.preventDefault();
	}
    }
}
function editbox_bmdown(e)
{
	this.style.borderStyle = 'inset';
	if (msie_version > 0) {
		window.event.cancelBubble = true;
		window.event.returnValue = false;
	} else {
		e.preventDefault();
		e.stopPropagation();
	}
}
function editbox_bmup()
{
	if (this.style.borderBottomColor == '#c0c0c0' || this.style.borderBottomColor == 'rgb(192, 192, 192)') this.style.borderStyle = 'outset';
	else this.style.borderStyle = 'solid';
	if (msie_version > 0) {
		window.event.cancelBubble = true;
		window.event.returnValue = false;
	}
}
function editbox_bmclick(editbox, cmd)
{
	var url,i;
	if (msie_version > 0) {
		window.event.cancelBubble = true;
		window.event.returnValue = false;
	}
	if (cmd == 'HTML') {
		if (editbox.iframe_obj.style.display == 'none') {
			editbox.buttons[editbox.buttons.length-2].style.borderStyle = 'solid';
			editbox.doc.body.innerHTML = editbox.textarea_orig.value;
			editbox.textarea_orig.style.display = 'none';	
			editbox.iframe_obj.style.display = 'block';	
			editbox.table2.style.display = 'none';
			editbox.table1.style.display = 'block';
			if (gecko_version > 0) {
				editbox.doc.designMode = 'on';
				editbox.doc.execCommand('useCSS', false, true);
				editbox.doc.execCommand('defaultParagraphSeparator', false, 'br');	
			        editbox.doc.execCommand('styleWithCSS', false, false);	
			}
		} else {
			editbox.buttons[editbox.buttons.length-1].style.borderStyle = 'solid';
			editbox.textarea_orig.value = FilterHTML(editbox.doc.body.innerHTML, 0);
			editbox.table1.style.display = 'none';
			editbox.table2.style.display = 'block';
			editbox.iframe_obj.style.display = 'none';	
			editbox.textarea_orig.style.display = 'block';	
		}
	} else 
	if (cmd == 'Grow') {
	    editbox_resize(editbox, 100);
	} else
	if (cmd == 'Shrink') {
	    editbox_resize(editbox, -100);
	} else
	if (editbox.iframe_obj.style.display != 'none') {
		editbox.iframe_obj.contentWindow.focus();
		if (cmd == 'CreateLink') {
			url = '';
			/* je neco vybrano? */
			var s = getSel(editbox);
			if (msie_version) {
			    if (s.htmlText == '') {
				alert('Musí být vybrána èást textu');
			    } else {
			    	if (s.parentElement().tagName == "A") url = s.parentElement().href;
			    	url = prompt('Zadejte URL (http://www.../...html) pro "'+s.parentElement().innerText+'":', url);
			    	if (url == '') editbox.doc.execCommand('unlink', false, null);
			    	else 
				if (url != null) editbox.doc.execCommand(cmd, false, url);
			    }
			} else {
			    if (s == '') {
				alert('Musí být vybrána èást textu');
			    } else {
				var node = s.startContainer;
				if (node.nodeType == 1) node = node.childNodes[s.startOffset];
				var endnode = s.endContainer;
				if (endnode.nodeType == 1) endnode = endnode.childNodes[s.endOffset];
//				alert(node.nodeType);
//				if (node.nodeType == 1) alert(node.tagName)
//				else alert(node.data);
				do {
					if (node.nodeType == 1 && node.tagName == 'A') {
//					    alert(node.attributes.length);
					    for (i = 0; i < node.attributes.length; i++) {
//					    	alert(node.attributes.item(i).nodeName);
						if (node.attributes.item(i).nodeName == 'href') url = node.attributes.item(i).nodeValue;
					    }
					    // remove A element, move content up
					    // node.removeNode(true);
					    // node.previousSibling.appendChildren(node.children);
					    break;
					}
					node = node.nextSibling;
				} while (node && node != endnode);
			    	url = prompt('Zadejte URL (http://www.../...html) pro "'+s+'":', url);
			    	if (url == '') editbox.doc.execCommand('unlink', false, null);
			    	else 
				if (url != null) editbox.doc.execCommand(cmd, false, url);
			    } 
			}
			editbox.buttons[11].style.borderStyle = 'solid';
		} else 
		if (cmd == 'InsertImg') {
			url = prompt('Zadejte URL (http://www.../...gif) for :'+s, '');
			editbox.doc.execCommand(cmd, false, url);
		} else 
		if (cmd == 'InsertUnorderedList' || cmd == 'InsertOrderedList') {
			if (gecko_version) {	/* pokud pouze li, pak zmizi */
			    var node = editbox.doc.body.firstChild;
			    if (node && editbox.doc.body.childNodes.length == 1 && node.nodeName == 'LI') {
			        var e;
				if (cmd == 'InsertUnorderedList') e = editbox.doc.createElement("ul");
				else e = editbox.doc.createElement("ol");
				editbox.doc.body.appendChild(e);
				e.appendChild(node);
			    } else {
				editbox.doc.execCommand(cmd, false, null);
			    }
			} else {
			    editbox.doc.execCommand(cmd, false, null);
			}
			if (false && gecko_version) {
			/* fix Firefox 2.x */
			    var node = editbox.iframe_obj.contentDocument.firstChild;
			    if (node) {
				var body = 0;
				var i = 0;
				while (i < node.childNodes.length) {
				    var e = node.childNodes[i];
				    i++;
				    if (e.nodeType == 1 && e.tagName == 'HEAD') continue;
				    if (e.nodeType == 1 && e.tagName == 'BODY') {
					if (body) {
					/* druhe body presunout do prvniho */
					    for (var ii = 0; ii < e.childNodes.length; ii++) {
						body.appendChild(e.childNodes[ii].cloneNode(true));
					    }
					    node.removeChild(e);
					    i--;
					} else {
					    body = e;
					}
					continue;
				    }
				    if (!body) continue;
				    /* vse ostatni je mimo */
				    body.insertBefore(e.cloneNode(true), body.firstChild);
				    node.removeChild(e);
				    i--;
				}
			    }
			}
		} else {
		    if (false && edge_version) {
			if (cmd == 'bold' || cmd == 'italic' || cmd == 'underline') {
				val = editbox.doc.queryCommandState(cmd);
				if (val) editbox.doc.execCommand('removeFormat', false);
				else editbox.doc.execCommand(cmd, false, null);
			} else {
				editbox.doc.execCommand(cmd, false, null);
			}

		    } else {
			editbox.doc.execCommand(cmd, false, null);
			var img = editbox.doc.getElementsByTagName('img');
			for (var i = 0; i < img.length; i++) {
			    img[i].onclick = editbox_img;
			}
		    }
		}
		editbox.iframe_obj.contentWindow.focus();
	}
	UpdateButtons(editbox, cmd);
}

function UpdateButtons(editbox, cmd) 
{
	var i,val;
	if (editbox.iframe_obj.style.display != 'none') {
		for (i = 0; i < editbox.buttons.length-2; i++) {
			if (i == 3) cmd2 = 'bold';
			else
			if (i == 4) cmd2 = 'italic';
			else
			if (i == 5) cmd2 = 'underline';
			else
			if (i == 6) cmd2 = 'justifyleft';
			else
			if (i == 7) cmd2 = 'justifycenter';
			else
			if (i == 8) cmd2 = 'justifyright';
			else cmd2 = '';
			if (cmd2 != '') {   //queryCommandValue()
				val = editbox.doc.queryCommandState(cmd2);
				if (val) {
					editbox.buttons[i].style.borderColor = '#b0b0b0';
					editbox.buttons[i].style.borderStyle = 'inset';
				} else {
					editbox.buttons[i].style.borderColor = '#c0c0c0';
					if (cmd != cmd2) editbox.buttons[i].style.borderStyle = 'solid';
				}
			} else 
			editbox.buttons[i].style.borderColor = '#c0c0c0';
		}
	}
}

function AddButton(editbox, elt, alt, src, off)
{
	var td,img;
	if (editbuttons.length > editbox.buttons.length) {
		td = editbuttons[editbox.buttons.length].cloneNode(true);
		td.onmouseover = editbox_bmover;
		td.onmouseout = editbox_bmout;
		td.onmousedown = editbox_bmdown;
		td.onmouseup = editbox_bmup;
		td.onclick = function () { editbox_bmclick(editbox, alt); };
		editbox.buttons.push(td);
	} else
	if (true) {
		td = document.createElement('td');
		td.style.border = 'solid 2px #c0c0c0';
		td.width = 21;
		td.height = 20;
		img = document.createElement('div');
		img.className = 'tabut';
		img.style.backgroundPositionY = (-off)+"px";
		if (msie_version > 55) img.unselectable = 'on';	// bez toho nefunguji tlacitka
		img.appendChild(document.createTextNode(' '));
		td.appendChild(img);
		editbuttons[editbox.buttons.length] = td;
		td.onmouseover = editbox_bmover;
		td.onmouseout = editbox_bmout;
		td.onmousedown = editbox_bmdown;
		td.onmouseup = editbox_bmup;
		td.onclick = function () { editbox_bmclick(editbox, alt); };
		editbox.buttons.push(td);
	} else
	if (false) {
		td = document.createElement('td');
		td.style.border = 'solid 2px #c0c0c0';
		td.width = 21;
		td.height = 20;
		img = document.createElement('div');
		img.className = src;
		if (msie_version > 55) img.unselectable = 'on';	// bez toho nefunguji tlacitka
		img.appendChild(document.createTextNode(' '));
		td.appendChild(img);
		editbuttons[editbox.buttons.length] = td;
		td.onmouseover = editbox_bmover;
		td.onmouseout = editbox_bmout;
		td.onmousedown = editbox_bmdown;
		td.onmouseup = editbox_bmup;
		td.onclick = function () { editbox_bmclick(editbox, alt); };
		editbox.buttons.push(td);
	} else 
	if (false) {
		td = document.createElement('td');
		img = document.createElement('img');
		img.src = '/images/'+src;
		img.width = 21;
		img.height = 20;
		img.style.border = 'solid 2px #c0c0c0';
		img.onmouseover = editbox_bmover;
		img.onmouseout = editbox_bmout;
		img.onmousedown = editbox_bmdown;
		img.onmouseup = editbox_bmup;
		img.onclick = function() { editbox_bmclick(editbox, alt); };
		editbox.buttons.push(img);
		td.appendChild(img);
	}
	elt.appendChild(td);
}

function taempty()
{
}

function EditBox(tag, n)
{
	var tr,tb,table,srcifr;
	if (typeof tag == 'string') this.textarea_orig = document.getElementById(tag);
	else this.textarea_orig = tag;	/* object */
	this.div_obj = document.createElement('div');
	this.div_obj.className = 'editbox';
	this.div_obj.unselectable = 1;
	this.table1 = table = document.createElement('table');
	table.style.border = '1px solid black';
	table.style.boxSizing = 'border-box'; 
	table.style.borderCollapse = 'separate';
	if (gecko_version > 0) table.width = 15*25+2;
	table.cellPadding = 0;
	table.cellSpacing = 0;
	tb = document.createElement('tbody');
	table.appendChild(tb);
	tr = document.createElement('tr');
	tb.appendChild(tr);
	this.buttons = [];
	var tabutoff = 0;
	AddButton(this, tr, 'cut', 'cut', tabutoff); tabutoff+=20;
	AddButton(this, tr, 'copy', 'copy', tabutoff); tabutoff+=20;
	AddButton(this, tr, 'paste', 'paste', tabutoff); tabutoff+=20;
	AddButton(this, tr, 'bold', 'bold', tabutoff); tabutoff+=20;
	AddButton(this, tr, 'italic', 'italic', tabutoff); tabutoff+=20;
	AddButton(this, tr, 'underline', 'underline', tabutoff); tabutoff+=20;
	AddButton(this, tr, 'JustifyLeft', 'justifyleft', tabutoff); tabutoff+=20;
	AddButton(this, tr, 'JustifyCenter', 'justifycenter', tabutoff); tabutoff+=20;
	AddButton(this, tr, 'JustifyRight', 'justifyright', tabutoff); tabutoff+=20;
	AddButton(this, tr, 'InsertUnorderedList', 'unorderedlist', tabutoff); tabutoff+=20;
	AddButton(this, tr, 'InsertOrderedList', 'orderedlist', tabutoff);  tabutoff+=20;
	AddButton(this, tr, 'Grow', 'grow', tabutoff);  tabutoff+=20;
	AddButton(this, tr, 'Shrink', 'shrink', tabutoff);  tabutoff+=20;
	AddButton(this, tr, 'CreateLink', 'link', tabutoff);  tabutoff+=20;
	AddButton(this, tr, 'HTML', 'html', tabutoff); tabutoff+=20;
	this.table2 = table = document.createElement('table');
	table.style.border = '1px solid black';
	table.style.boxSizing = 'border-box'; 
	table.cellPadding = 0;
	table.cellSpacing = 0;
	table.style.borderCollapse = 'separate';
	if (gecko_version > 0) table.width = 25+2;
	tb = document.createElement('tbody');
	table.appendChild(tb);
	tr = document.createElement('tr');
	tb.appendChild(tr);
	AddButton(this, tr, 'HTML', 'wyswig', tabutoff);
	this.table2.style.display = 'none';
	this.div_obj.appendChild(this.table1);
	this.div_obj.appendChild(this.table2);
	srcifr = document.getElementById("iframe_"+this.textarea_orig.name);
	if (srcifr) this.iframe_obj = srcifr;
	else {
	    this.iframe_obj = document.createElement('iframe');
	    this.iframe_obj.id = "iframe_taedit" + n;
	}
	if (document.body.clientWidth && this.textarea_orig.offsetWidth > document.body.clientWidth-8) this.iframe_obj.style.width = (document.body.clientWidth-8)+'px';
	else this.iframe_obj.style.width = this.textarea_orig.offsetWidth+'px';
	this.iframe_obj.style.height = this.textarea_orig.offsetHeight+'px';
	this.iframe_obj.style.border = '1px solid #808080';
	this.iframe_obj.style.backgroundColor = 'white';
	this.iframe_obj.style.padding = 0;
	this.iframe_obj.frameBorder = 0;
	if (msie_version >= 55) {
		this.iframe_obj.application = 'yes';
		if (msie_version == 60) this.iframe_obj.src = 'javascript:taempty()';
		else this.iframe_obj.src = 'about:blank'; 
	}
	if (!srcifr) {
 	    this.div_obj.appendChild(this.iframe_obj); 
	}
	this.textarea_orig.parentNode.insertBefore(this.div_obj, this.textarea_orig);
	this.textarea_orig.style.display = 'none';	// hide
}

function EditSubmit()
{
	var i;
	for (i = 0; i < editboxes.length; i++) {
		if (editboxes[i].iframe_obj.style.display != 'none') {
			editboxes[i].textarea_orig.value = editboxes[i].doc.body.innerHTML;
		}
		editboxes[i].textarea_orig.value = FilterHTML(editboxes[i].textarea_orig.value, 1);
	}
	return true;
}

function ParseVersion(pos)
{
	return parseInt(Browser.substring(pos))*10+parseInt(Browser.substr(Browser.indexOf('.', pos)+1,1));
}		

function FinishInit()
{
	var i;
	if (msie_version >= 55) {
		for (i = 0; i < editboxes.length; i++) {
			UpdateButtons(editboxes[i], '');
		}
	}
}

function StartOnLoad()
{
	var i;
	if (Browser.substr(0, 8) == 'Mozilla/') {
		mozilla_version = ParseVersion(8);
		msie = Browser.indexOf('MSIE');
		if (msie > 0 && Browser.indexOf('Opera') == -1) {
		    msie_version = ParseVersion(msie+5);
		} else
		if ((i = Browser.indexOf('Chrome/')) > 0) {
		    // od verze Chrome/0.2
		    var j;
		    gecko_version = 13; 
		    if ((j = Browser.indexOf('Edge/')) > 0) edge_version = ParseVersion(j+5);
		    else
		    if ((j = Browser.indexOf('Trident/')) > 0) edge_version = ParseVersion(j+8);
		    else chrome_version = ParseVersion(i+7);
		} else
		if ((i = Browser.indexOf('Konqueror')) > 0) {
		    // nefunguje aspon do verze 4.3
		    if (ParseVersion(i+10) > 43) gecko_version = 13;
		} else
		if (Browser.indexOf('Safari') > 0) {
		    // od verze Safari 3 (Safari/500)
		    if (Browser.indexOf('Version') > 0) gecko_version = 13;
		} else
		if (Browser.indexOf('Gecko') > 0) {
		    gecko = Browser.indexOf('rv:');
		    if (gecko > 0) gecko_version = ParseVersion(gecko+3);
		}
	} else 
	if (Browser.substr(0, 6) == 'Opera/') {
		mozilla_version = 50;
		opera_version = ParseVersion(6);
		if (opera_version > 95) gecko_version = 13;
	}
//	alert('mozilla='+mozilla_version+',msie='+msie_version+',gecko='+gecko_version+',opera='+opera_version);
	if (mozilla_version >= 40 && (msie_version >= 55 || gecko_version >= 13)) {
		var areas = document.getElementsByTagName('textarea');
		var j = 0;
		for (i = 0; i < areas.length; i++) {
			if (areas[i].className == 'readonly') continue;
			if (areas[i].className == 'copyPaste') continue;
			editboxes.push(new EditBox(areas[i], j));
			j++;
		}
		for (i = 0; i < editboxes.length; i++) {
			if (gecko_version == 0) {
//			    setTimeout("InitIframe(editboxes["+i+"]);", 100);
			    InitIframe(editboxes[i]);
			} else {
			    setTimeout(InitIframe, 200, editboxes[i]);
			}
		}
//		if (gecko_version == 0) {
//			setTimeout(FinishInit, 1000);
//		}
	}
}
