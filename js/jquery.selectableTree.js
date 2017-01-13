
(function ($) {
    $.selectableTree = function (element, options) {
        if (options != null && options.dataSource != null) {
            var defaults = {
                colorInHeader: true,
                collapsed: true,
                onFoo: function () { }

            }
            var plugin = this;
            plugin.settings = {}
            var $tree = $(element), 
                 tree = element; 
            plugin.init = function () {
                plugin.originalDataSource = options.dataSource;
                delete options.dataSource;
                plugin.settings = $.extend({}, defaults, options);
                $tree.html('');
                $tree.addClass('tree').addClass('list-group');
                $(plugin.originalDataSource).each(function (index, parent) {
                    $tree.append("<a class='parent list-group-item' data-id='" + String(parent.Item.Value) + "'><i class='fa fa-angle-up collapsed'/> " + parent.Item.Text + " <span class='badge'></span><i class='fa pull-right check' aria-hidden='true'/></a>");
                    var $parentDOM = $tree.children().last();
                    $parentDOM.find('.check').last().on('click', function (e) {
                        selectAll($(this), $tree);
                        if (options.onCheck !== undefined) 
                            options.onCheck(e, getObjectItem($(this)));
                    });
                    $parentDOM.on('click', function (e) {
                        if(!$(e.target).hasClass('check'))
                            collapse($(this).find('.collapsed').last());
                    });
                    var $children = $(parent.Children);
                    var selectedChildren = 0;
                    $children.each(function (i, child) {
                        $tree.append("<a class='child list-group-item' data-dirty=false data-parent='" + String(parent.Item.Value) + "' data-id='" + String(parent.Item.Value) + "-" + child.Value + "'><span class='texto'>" + child.Text + "</span><i class='fa pull-right check' aria-hidden='true'></a>");
                        var $childDOM = $tree.children().last();
                        if (child.Selected) {
                            $childDOM.find('.check').last().addClass('fa-circle');
                            selectedChildren += 1;
                        }
                        else
                            $childDOM.find('.check').last().addClass('fa-circle-o');

                        $childDOM.data('originalSelected', child.Selected);
                        $childDOM.find('.check').last().on('click', function (e) {
                            select($(this), $tree);
                            if (options.onCheck !== undefined)
                                options.onCheck(e, getObjectItem($(this)));
                        });
                    });

                    if (selectedChildren == parent.Children.length) {
                        if (plugin.settings.colorInHeader)
                            $parentDOM.addClass('list-group-item-success');
                        $parentDOM.find('.check').last().addClass('fa-circle');
                    }
                    else
                        if (selectedChildren > 0) {
                            if (plugin.settings.colorInHeader)
                                $parentDOM.addClass('list-group-item-warning');
                            $parentDOM.find('.check').last().addClass('fa-circle-thin');
                        }
                        else {
                            if (plugin.settings.colorInHeader)
                                $parentDOM.addClass('list-group-item-danger');
                            $parentDOM.find('.check').last().addClass('fa-circle-o');
                        }
                    if (parent.Children.length > 0)
                        $parentDOM.find('.badge').html(selectedChildren + " / " + parent.Children.length);
                    else
                        $parentDOM.find('.badge,.fa').remove();
                });
                if (plugin.settings.collapsed != null && plugin.settings.collapsed == true)
                    $tree.find('.collapsed').each(function (i, v) {
                        collapse($(this));
                    });
            }

            // public methods
            plugin.reset = function () {
                $tree.data('selectableTree', null);
            }

            plugin.getDataSource = function () {
                var datos = [];
                $tree.find('.parent').each(function (i, v) {
                    var objeto = new Object();
                    objeto.Item = new Object();
                    objeto.Item.Text = $(this).find('.texto').html();
                    objeto.Item.Value = $(this).data('id');
                    var hijos = [];
                    $(getChildren($(v).find('.check'), $tree)).each(function (ind, va) {
                        var item = new Object();
                        item.Selected = isSelect($(this).find('.check'));
                        item.Text = $(this).find('span').first().html();
                        item.Value = $(this).data('id').split('-')[1];
                        item.Dirty = $(this).data('dirty');
                        item.OriginalSelected = $(this).data('originalSelected');
                        hijos.push(item);
                    });
                    objeto.Children = hijos;
                    datos.push(objeto);
                });
                return datos;
            }
            plugin.isDirty = function () {
                return $tree.data('dirty');
            }
            // end public methods

            // private methods
            var getObjectItem = function (item) {
                if (item.parent().hasClass('parent')) {
                    var objeto = new Object();
                    objeto.Item = new Object();
                    objeto.Item.Text = item.parent().find('.texto').html();
                    objeto.Item.Value = item.parent().data('id');
                    var hijos = [];
                    $(getChildren($(item.parent()).find('.check'), $tree)).each(function (ind, va) {
                        var it = new Object();
                        it.Selected = isSelect($(this).find('.check'));
                        it.Text = $(this).find('span').first().html();
                        it.Value = $(this).data('id').split('-')[1];
                        it.Dirty = $(this).data('dirty');
                        it.OriginalSelected = $(this).data('originalSelected');
                        hijos.push(it);
                    });
                    objeto.Children = hijos;
                    return objeto;
                }
                else {
                    var it = new Object();
                    it.Selected = isSelect(item);
                    it.Text = item.parent().find('span').first().html();
                    it.Value = item.parent().data('id').split('-')[1];
                    it.Dirty = item.parent().data('dirty');
                    it.OriginalSelected = item.parent().data('originalSelected');
                    return it;
                }

            }

            var collapse = function (item, tree) {
                var children = getChildren(item);
                var collapsed = isCollapsed(item);
                $(children).each(function (i, v) {
                    if (collapsed)
                        v.show();
                    else
                        v.hide();
                });
                changeCollapsed(item);
            }
            var selectAll = function (item, tree) {
                if (item.parent().data('parent') == null) {
                    var marcar = !isSelect(item);

                    var children = getChildren(item);

                    $(children).each(function (i, v) {
                        var $i = v.find('.check');
                        if (marcar)
                            check($i);
                        else
                            uncheck($i);
                    });
                    if (marcar) {
                        checkHeader($(item));
                        item.parent().find('.badge').html($(children).length + " / " + $(children).length);
                    }
                    else {
                        uncheckHeader($(item));
                        item.parent().find('.badge').html("0 / " + $(children).length);
                    }

                }
            }

            var select = function(item, tree) {

                cambiarSeleccion(item)
                var brothers = getBrothers(item);
                var total = 0, selected = 0;
                $(brothers).each(function (i, v) {
                    total += 1;
                    if (isSelect(v.find('.check')))
                        selected += 1;
                });
                if (isSelect(item))
                    selected += 1;
                total += 1;
                var $parent = getParent(item.parent().data('parent'), tree);
                $parent.find('.badge').html(selected + " / " + total);
                var $i = $parent.find('.check');
                if (selected == total && selected == brothers.length + 1)
                    checkHeader($i);
                else if (selected == 0)
                    uncheckHeader($i);
                else
                    threeStateHeader($i);

            }

            var getParent = function (idParent, tree) {
                return $(tree).find(".list-group-item[data-id='" + idParent + "']");
            }

            var getChildren = function(item) {
                var retorno = [];
                item.parent().siblings().each(function (index, value) {
                    var $value = $(value);
                    if (String($value.data('id')).indexOf("-") >= 0) {
                        var arr = String($value.data('id')).split("-");
                        if (arr[0] == String(item.parent().data('id')))
                            retorno.push($value);
                    }
                });
                return retorno;
            }

            var getBrothers = function (item) {
                var retorno = [];
                item.parent().siblings().each(function (index, value) {
                    var $value = $(value);
                    if (String($value.data('id')).indexOf("-") >= 0) {
                        var arr = String($value.data('id')).split("-");
                        if (arr[0] == item.parent().data('parent'))
                            retorno.push($value);
                    }
                });
                return retorno;
            }

            //item = $('.collapsed')
            var isCollapsed = function (item) {
                return item.hasClass('fa-angle-down');
            }
            //item = $('.collapsed')
            var changeCollapsed = function (item) {
                item.toggleClass('fa-angle-up');
                item.toggleClass('fa-angle-down');
            }

            //item = $('.check')
            var isSelect = function (item) {
                return item.hasClass('fa-circle');
            }
            //item = $('.check')
            var cambiarSeleccion = function (item) {
                item.toggleClass('fa-circle');
                item.toggleClass('fa-circle-o');
                item.parent().data('dirty', true);
                $tree.data('dirty', true);
            }

            var check = function (item) {
                item.addClass('fa-circle');
                item.removeClass('fa-circle-o');
                item.parent().data('dirty', true);
                $tree.data('dirty', true);
            }
            //item = $('.check')
            var uncheck = function (item) {
                item.addClass('fa-circle-o');
                item.removeClass('fa-circle');
                item.parent().data('dirty', true);
                $tree.data('dirty', true);
            }

            //item = $('.check')
            var checkHeader = function (item) {
                item.addClass('fa-circle');
                item.removeClass('fa-circle-o');
                item.removeClass('fa-circle-thin');
                var $tree = item.closest('.tree');
                if (plugin.settings.colorInHeader) {
                    item.parent().addClass('list-group-item-success');
                    item.parent().removeClass('list-group-item-warning');
                    item.parent().removeClass('list-group-item-danger');
                }
            }
            //item = $('.check')
            var uncheckHeader = function (item) {
                item.addClass('fa-circle-o');
                item.removeClass('fa-circle');
                item.removeClass('fa-circle-thin');
                var $tree = item.closest('.tree');
                if (plugin.settings.colorInHeader) {
                    item.parent().removeClass('list-group-item-success');
                    item.parent().removeClass('list-group-item-warning');
                    item.parent().addClass('list-group-item-danger');
                }
            }
            //item = $('.check')
            var threeStateHeader = function (item) {
                item.removeClass('fa-circle-o');
                item.removeClass('fa-circle');
                item.addClass('fa-circle-thin');
                var $tree = item.closest('.tree');
                if (plugin.settings.colorInHeader) {
                    item.parent().removeClass('list-group-item-success');
                    item.parent().addClass('list-group-item-warning');
                    item.parent().removeClass('list-group-item-danger');
                }
            }

            // end private methods
            plugin.init();
        }
        else
            console.error('El plugin necesita el parámetro dataSource.');
    }
    $.fn.selectableTree = function (options) {
        return this.each(function () {
            if (undefined == $(this).data('selectableTree')) {
                var plugin = new $.selectableTree(this, options);
                $(this).data('selectableTree', plugin);
            }
        });
    }
})(jQuery);
