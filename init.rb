require_dependency File.expand_path('../lib/wiki_table_formatter/hooks.rb', __FILE__)

Redmine::Plugin.register :redmine_wiki_table_formatter do
  name 'Redmine Wiki Table Formatter'
  author 'sk-ys'
  description 'This is a plugin for Redmine'
  version '0.0.1'
  url 'https://github.com/sk-ys/redmine_wiki_table_formatter'
  author_url 'https://github.com/sk-ys'
end
