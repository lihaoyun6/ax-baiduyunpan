// ==UserScript==
// @name         AX-百度云盘
// @namespace    https://github.com/lihaoyun6/ax-baiduyunpan
// @version      0.11.9
// @description  百度网盘文件直链提取, 支持一键发送至Axeldown进行下载
// @author       lihaoyun6
// @license      MIT
// @supportURL   https://github.com/lihaoyun6/ax-baiduyunpan/issues
// @date         01/01/2018
// @modified     22/03/2018
// @match        *://pan.baidu.com/disk/home*
// @match        *://yun.baidu.com/disk/home*
// @match        *://pan.baidu.com/s/*
// @match        *://yun.baidu.com/s/*
// @match        *://pan.baidu.com/share/link?*
// @match        *://yun.baidu.com/share/link?*
// @match        *://eyun.baidu.com/s/*
// @match        *://eyun.baidu.com/enterprise/*
// @run-at       document-end
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @require      https://cdn.bootcss.com/jquery/1.7.1/jquery.min.js
// @require      https://cdn.bootcss.com/clipboard.js/1.5.16/clipboard.min.js
// ==/UserScript==

(function(require, define, Promise) {
	'use strict';

	unsafeWindow.api = function(action, data, callback) {
			if (data === undefined) data = new Object;
			data['action'] = action;
			var axeladdr = window.localStorage ? localStorage.getItem("axeladdr") : Cookie.read("axeladdr");
			if (!axeladdr) {
				var axeladdr = "127.0.0.1";
				if (window.localStorage) {
					localStorage.setItem("axeladdr", axeladdr);
				} else {
					Cookie.write("axeladdr", axeladdr);
				}
			}
			var axelport = window.localStorage ? localStorage.getItem("axelport") : Cookie.read("axelport");
			if (!axelport) {
				var axelport = "2333";
				if (window.localStorage) {
					localStorage.setItem("axelport", axelport);
				} else {
					Cookie.write("axelport", axelport);
				}
			}
			GM_xmlhttpRequest({
				url: 'http://' + axeladdr + ':' + axelport + '/api',
				method: 'POST',
				data: JSON.stringify(data),
				dataType: 'json',
				success: function(ret) {
					callback(ret);
				},
				error: function(ret) {
					console.error(ret);
					alert("内部错误，请刷新页面, 若无效需重启Axeldown");
				},
				timeout: function(ret) {
					console.error("request timeout");
					alert("请求超时，请重启Axeldown");
				}
			});
		};
	unsafeWindow.axeldown = function(urls, filename, thsize) {
	    //alert(urls);
		urls = urls.split('|');
		filename = filename.split('|');
		//var thsize = thread;
		for (var i in urls) {
			var url = urls[i];
			var output = filename[i];
			var parts = url.split('\t');
			console.log(parts);
			if (parts.length > 1) {
				url = parts[0];
				output = parts[1];
			}
			var options = {
				options: {
					url: url,
					output: output,
					thsize: thsize,
					immediately: true
				}
			};
			api('create', options,
			function() {
				setTimeout(refresh, 1000);
			});
		}
	};

	function showError(msg) {
		GM_addStyle('#errorDialog{position: fixed;top: 76.5px; bottom: auto; left: 423px; right: auto;background: #fff;border: 1px solid #ced1d9;border-radius: 4px;box-shadow: 0 0 3px #ced1d9;color: black;word-break: break-all;display: block;width: 520px;padding: 10px 20px;z-index: 9999;}#errorDialog h3{border-bottom: 1px solid #ced1d9;font-size: 1.5em;font-weight: bold;}');
		var $;
		try {
			$ = require('base:widget/libs/jquerypacket.js');
		} catch (e) {
			var div = document.createElement('div');
			$ = function(str) {
				div.innerHTML = str;
				div.onclick = function() { this.remove(); };
				return $;
			};
			$.on = function() {
				return { appendTo: function() { document.body.appendChild(div); } };
			};
		}
		var $dialog = $('<div id="errorDialog">' +
						'<h3>AX-baiduyunpan:程序异常</h3>' +
						'<div class="dialog-body"><p>请尝试更新脚本或复制以下信息<a href="https://github.com/lihaoyun6/ax-baiduyunpan/issues" target="_blank">提交issue</a></p>' +
						'<p>Exception: ' + msg + '</p>' +
						'<p>Script Ver: ' + GM_info.script.version + '</p>' +
						'<p>TemperMonkey Ver: ' + GM_info.version + '</p>' +
						'<p>UA: ' + navigator.userAgent + '</p>' +
						'</div><hr><a class="close" href="javascript:;">关闭</a></div>');
		$dialog.on('click', '.close', function(event) {
			$dialog.remove();
		}).appendTo(document.body);
	}
	define('ax-yunpan:pageInfo', function(require) {
		var url = location.href;
		var currentPage = 'pan';
		var matchs = {
			'.*://pan.baidu.com/disk/home.*': 'pan',
			'.*://yun.baidu.com/disk/home.*': 'pan',
			'.*://pan.baidu.com/s/.*': 'share',
			'.*://yun.baidu.com/s/.*': 'share',
			'.*://pan.baidu.com/share/link?.*': 'share',
			'.*://yun.baidu.com/share/link?.*': 'share',
			'.*://eyun.baidu.com/s/.*': 'enterprise',
			'.*://eyun.baidu.com/enterprise/.*': 'enterprise'
		};
		var PAGE_CONFIG = {
			pan: {
				prefix: 'function-widget-1:',
				containers: ['.g-button:has(.icon-download):visible'],
				style: function() {
				}
			},
			share: {
				prefix: 'function-widget-1:',
				containers: [
					'.KKtwaH .x-button-box>.g-button:has(.icon-download)',
					'.module-share-top-bar .x-button-box>.g-button:has(.icon-download)'
				],
				style: function() {
					var styleList = [
						'.KPDwCE .QxJxtg{z-index: 2;}',
						'.module-share-header .slide-show-right{width: auto;}',
						'.ax-yunpan-dropdown-button.g-dropdown-button.button-open .menu{z-index:41;}',
						'.module-share-header .slide-show-header h2{width:230px;}',
						'.KPDwCE .xGLMIab .g-dropdown-button.ax-yunpan-dropdown-button{margin: 0 5px;}'
					];
					GM_addStyle(styleList.join(''));
				}
			},
			enterprise: {
				prefix: 'business-function:',
				containers: ['.button-box-container>.g-button:has(:contains("下载"))'],
				style: function() {
					var styleList = [
						'.ax-yunpan-dropdown-button .icon-download{background-image: url(/box-static/business-function/infos/icons_z.png?t=1476004014313);}',
						'.ax-yunpan-dropdown-button .g-button:hover .icon-download{background-position: 0px -34px;}'
					];
					GM_addStyle(styleList.join(''));
				}
			}
		};
		for (var match in matchs) {
			if (new RegExp(match).test(url) === true) {
				currentPage = matchs[match];
			}
		}
		return PAGE_CONFIG[currentPage];
	});

	define('ax-yunpan:downloadBtnInit', function(require) {
		var ctx = require('system-core:context/context.js').instanceForSystem;
		var $ = require('base:widget/libs/jquerypacket.js');
		var pageInfo = require('ax-yunpan:pageInfo');
		var prefix = pageInfo.prefix;
		var dServ = null;
		require.async(prefix + 'download/service/dlinkService.js', function(dlinkService) {
			dServ = dlinkService;
		});

		var menu = [{
			title: '下载设置',
			'click': function() {
				var clipboard = new Clipboard('.btn');
					clipboard.on('success',
					function(e) {
						dialog.hide();
					});
					clipboard.on('error',
					function(e) {
						dialog.hide();
					});
				var axeladdr = window.localStorage ? localStorage.getItem("axeladdr") : Cookie.read("axeladdr");
				//alert(axeladdr);
				if (!axeladdr) {
					axeladdr = "127.0.0.1";
				}
				//alert(axeladdr);
				var axelport = window.localStorage ? localStorage.getItem("axelport") : Cookie.read("axelport");
				if (!axelport) {
					axelport = "2333";
				}
				var axelthread = window.localStorage ? localStorage.getItem("axelthread") : Cookie.read("axelthread");
				if (!axelthread) {
					axelthread = "32";
				}
				var text = '<label for="txt">Axeldown服务器地址: </label><input type="text" id="axeladdr" style="white-space: nowrap;" value="' + axeladdr + '" /><br><br><label for="txt">Axeldown服务器端口: </label><input type="text" id="axelport" style="white-space: nowrap;" value="' + axelport + '" /><br><br><label for="txt">Axeldown下载线程数: </label><input type="text" id="axelthread" style="white-space: nowrap;" value="' + axelthread + '" />';
				var dialog = ctx.ui.confirm({
					title: '下载设置',
					body: text,
					sureText: '保存设置',
					onClose: function() {
						//clipboard && clipboard.destory && clipboard.destroy();
					}
				});
				//alert(urls);
				dialog.buttonIns[0].dom.attr({
					'href': 'javascript:var axeladdr = document.getElementById("axeladdr").value;var axelport = document.getElementById("axelport").value;var axelthread = document.getElementById("axelthread").value;if (window.localStorage) {localStorage.setItem("axeladdr", axeladdr);localStorage.setItem("axelport", axelport);localStorage.setItem("axelthread", axelthread);} else {Cookie.write("axeladdr", axeladdr);Cookie.write("axelport", axelport);Cookie.write("axelthread", axelthread);};',
					'data-clipboard-action': 'copy',
					'data-clipboard-target': '#axeladdr'
				}).addClass('btn').off();
			},
			availableProduct: ['pan', 'share', 'enterprise']
		}, {
			title: 'AX-下载',
			'click': function() {
				var fetchDownLinks = require('ax-yunpan:fetchDownLinks.js');
				fetchDownLinks.start(ctx, dServ);
			},
			availableProduct: ['pan', 'share', 'enterprise']
		}, {
			title: 'AX-压缩下载',
			'click': function() {
				var fetchDownLinks = require('ax-yunpan:fetchDownLinks.js');
				fetchDownLinks.start(ctx, dServ, true);
			},
			availableProduct: ['pan', 'share', 'enterprise']
		}
		//,{
		//	title: 'AX-下载管理',
		//	'click': function() {
		//		var window_new = window.open("http://" + axeladdr + ":" + axelport + "");
		//		//GM.openInTab('"http://' + axeladdr + ':' + axelport'"');  
		//	},
		//	availableProduct: ['pan', 'share', 'enterprise']
		//}
		];

		var exDlBtnConfig = {
			type: 'dropdown',
			title: 'AX-下载',
			resize: true,
			menu: menu.filter(function (btn) {
				var currentProduct = ctx.pageInfo.currentProduct;
				return ~btn.availableProduct.indexOf(currentProduct);
			}),
			icon: 'icon-download'
		};
		var selector = pageInfo.containers.join();
		$(selector).each(function(i, e) {
			var exDlBtn = ctx.ui.button(exDlBtnConfig);
			$(e).after(exDlBtn.dom.addClass('ax-yunpan-dropdown-button'));
			exDlBtn.resizeButtonWidth();
		});
		pageInfo.style();
	});

	define('ax-yunpan:fetchDownLinks.js', function (require, exports, module) {
		var $ = require('base:widget/libs/jquerypacket.js');

		function start(ctx, dServ, allZip) {
			var selectedList = ctx.list.getSelected();
			if (selectedList.length === 0) return ctx.ui.tip({ mode: 'caution', msg: '您还没有选择下载的文件' });
			ctx.ui.tip({ mode: 'loading', msg: '开始请求链接...' });

			var foldersList = selectedList.filter(function(e) {
				return e.isdir === 1;
			});
			var filesList = selectedList.filter(function(e) {
				return e.isdir === 0;
			});

			var currentProduct = ctx.pageInfo.currentProduct;

			if (!~['pan', 'share', 'enterprise'].indexOf(currentProduct)) {
				return ctx.ui.tip({ mode: 'caution', msg: '获取链接在当前页面不可用', hasClose: true, autoClose: false });
			}

			if (filesList.length > 0 && currentProduct !== 'enterprise' && !allZip) {
				foldersList.unshift(filesList);
			} else {
				[].push.apply(foldersList, filesList);
			}

			var requestMethod;
			if (currentProduct === 'pan') {
				requestMethod = function(e, cb) {
					dServ.getDlinkPan(dServ.getFsidListData(e), allZip ? 'batch' : e.isdir === 1 ? 'batch' : 'nolimit', cb, undefined, undefined, 'POST');
				};
			} else if (currentProduct === 'share') {
				var yunData = require('disk-share:widget/data/yunData.js').get();
				requestMethod = function(e, cb) {
					dServ.getDlinkShare({
						share_id: yunData.shareid,
						share_uk: yunData.uk,
						sign: yunData.sign,
						timestamp: yunData.timestamp,
						list: e,
						type: allZip ? 'batch' : e.isdir === 1 ? 'batch' : 'nolimit'
					}, cb);
				};
			} else {
				var yunData = require('page-common:widget/data/yunData.js').get();
				requestMethod = function(e, cb) {
					dServ.getDlinkShare({
						share_id: yunData.shareid,
						share_uk: yunData.uk,
						sign: yunData.sign,
						timestamp: yunData.timestamp,
						list: [e],
						isForBatch: allZip
					}, cb);
				};
			}
			var timeout = foldersList.length === 1 ? 3e4 : 3e3;
			var promises = foldersList.map(function(e) {
				return new Promise(function(resolve, reject) {
					var timer = setTimeout(function() {
						resolve($.extend({}, e));
					}, timeout);
					requestMethod(e, function(result) {
						resolve($.extend({}, e, result));
					});
				});
			});
			Promise.all(promises).then(function(result) {
				ctx.ui.hideTip();
				var dlinks = [];
				var needToRetry = result.filter(function(e) {
					return e.errno !== 0;
				});
				if (needToRetry.length > 0) {
					try {
						dServ.dialog.hide();
					} catch (ex) {}
					ctx.ui.tip({
						mode: 'caution',
						msg: needToRetry.length + '个文件请求链接失败'
					});
				}
				result.filter(function(e) {
					return e.errno === 0;
				}).forEach(function(e) {
					if (typeof e.dlink === 'string') {
						var dlink = e.dlink + "&zipname=" + encodeURIComponent((e.isdir ? '【文件夹】' : '【文件】') + e.server_filename + '.zip');
						dlinks.push(e.dlink && dlink);
					} else {
						[].push.apply(dlinks, (e.dlink || e.list || []).map(function(e) {
							return e.dlink;
						}));
					}
				});
				if (dlinks.length === 0) return ctx.ui.tip({ mode: 'caution', msg: '失败：未获取到链接' });
				var clipboard = new Clipboard('.btn');
				clipboard.on('success', function(e) {
					ctx.ui.tip({ mode: 'success', msg: '成功' + dlinks.length + '个文件' });
					e.clearSelection();
					dialog.hide();
					clipboard.destroy();
				});
				clipboard.on('error', function(e) {
					ctx.ui.tip({ mode: 'caution', msg: '失败' });
				});
				var axelthread = window.localStorage ? localStorage.getItem("axelthread") : Cookie.read("axelthread");
				if (!axelthread) {
					var axelthread = "32";
					if (window.localStorage) {
						localStorage.setItem("axelthread", axelthread);
					} else {
						Cookie.write("axelthread", axelthread);
					}
				}
				var showurlss = dlinks.join('\n');
				var showurls = showurlss.replace(/d.pcs.baidu.com/g, 'pcs.baidu.com');
				var text = '<textarea id="bar" rows="' + ((dlinks.length > 20 ? 20 : dlinks.length) + 1) + '" style="width:100%;white-space: nowrap;">' + showurls + '</textarea><br><br><label for="txt">Axeldown下载线程数: </label><input type="text" id="axelthread" style="white-space: nowrap;" value="' + axelthread + '">';
				var filenames;
				var foldersList = selectedList.filter(function(e) {
					return e.isdir === 1;
				});
				var filesList = selectedList.filter(function(e) {
					return e.isdir === 0;
				});
				result.filter(function(e) {
					return e.errno === 0;
				}).forEach(function(e) {
					if (e.isdir === 1) {
						//alert('isdir');
						var filenamearr = [];
						//alert('nodir');
						for (var i = 0; i < foldersList.length; i++) {
							var fname = foldersList[i]['server_filename'];
							var ffname = fname.replace(/|/g, '');
							var fffname = ('【文件夹】' + ffname + '.zip');
							filenamearr.push(fffname);
						}
						filenames = filenamearr.join('|');
					} else {
						var filenamearr = [];
						//alert('nodir');
						for (var i = 0; i < filesList.length; i++) {
							var fname = filesList[i]['server_filename'];
							var ffname = fname.replace(/|/g, '');
							filenamearr.push(ffname);
						}
						filenames = filenamearr.join('|');
					}
				});
				//alert(filenames);
				var urlss = dlinks.join('|');
				var urls = urlss.replace(/d.pcs.baidu.com/g, 'pcs.baidu.com');
				//alert(urls);
					var dialog = ctx.ui.confirm({
						title: 'Axeldown下载',
						body: text,
						sureText: '发送到Axeldown下载',
						onClose: function() {
							//clipboard && clipboard.destory && clipboard.destroy();
						}
					});
					//alert(urls);
					dialog.buttonIns[0].dom.attr({
						'href': "javascript:var axelthread = document.getElementById('axelthread').value;window.axeldown('" + urls + "', '" + filenames + "', axelthread);",
						'data-clipboard-action': 'copy',
						'data-clipboard-target': '#bar'
					}).addClass('btn').off();
				}).catch(function(e) {
				showError(e);
			});
		};
		module.exports = {
			start: start
		};
	});

	define('ax-yunpan:pluginInit.js', function(require) {
		var ctx = require('system-core:context/context.js').instanceForSystem;
		var $ = require('base:widget/libs/jquerypacket.js');
		var pageInfo = require('ax-yunpan:pageInfo');
		var prefix = pageInfo.prefix;
		require.async(prefix + 'download/util/context.js', function(e) {
			e.getContext = function() {
				return ctx;
			};
		});
		var dmPromise = new Promise(function(resolve, reject) {
			$(unsafeWindow).on('load', function() {
				reject('downloadManager.js');
			});
			require.async(prefix + 'download/service/downloadManager.js', function(dm) {
				dm.MODE_PRE_INSTALL = dm.MODE_PRE_DOWNLOAD;
				resolve();
			});
		});
		var gjcPromise = new Promise(function(resolve, reject) {
			$(unsafeWindow).on('load', function() {
				reject('guanjiaConnector.js');
			});
			require.async(prefix + 'download/service/guanjiaConnector.js', function(gjC) {
				gjC.init = function() {
					setTimeout(function() {
						ctx.ui.tip({ mode: 'caution', msg: '检测到正在调用云管家，若脚本失效，请检查更新或提交issue', hasClose: true, autoClose: false });
					}, 5e3);
				};
				resolve();
			});
		});
		var ddsPromise = new Promise(function(resolve, reject) {
			$(unsafeWindow).on('load', function() {
				reject('downloadDirectService.js');
			});
			require.async(prefix + 'download/service/downloadDirectService.js', function(dDS) {
				var $preDlFrame = null;
				var _ = dDS.straightforwardDownload;
				if (typeof _ !== 'function') return;
				dDS.straightforwardDownload = function() {
					ctx.ui.tip({ mode: 'loading', msg: '正在开始下载...' });
					if ($preDlFrame === null) {
						setTimeout(function() {
							var $frame = $('#pcsdownloadiframe');
							if ($frame.length === 0) return;
							$frame.ready(function(event) { ctx.ui.hideTip(); });
							$preDlFrame = $frame;
						}, 1e3);
					}
					_.apply(dDS, arguments);
				};
				resolve();
			});
		});
		Promise.all([dmPromise, gjcPromise, ddsPromise]).then(function() {
			try {
				require('ax-yunpan:downloadBtnInit');
				ctx.ui.tip({ mode: 'success', msg: 'ax-baiduyunpan: 插件加载成功' });
			} catch (e) {
				ctx.ui.tip({ mode: 'caution', msg: 'ax-baiduyunpan: 插件加载成功，按钮初始化失败', autoClose: false, hasClose: true });
			}
		}).catch(function(msg) {
			if(document.querySelector('#share_nofound_des') !== null) return;
			showError(msg + '加载失败');
		});
	});
	try {
		require('ax-yunpan:pluginInit.js');
	} catch (ex) { showError(ex); }
})(unsafeWindow.require, unsafeWindow.define, unsafeWindow.Promise);
