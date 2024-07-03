class WikiTableFormatter::Hooks < Redmine::Hook::ViewListener
  render_on :view_layouts_base_html_head, :partial => "wiki_table_formatter/base"
end