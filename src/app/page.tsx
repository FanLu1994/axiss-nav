"use client"

import { useState, ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LinkCard } from "@/components/ui/link-card"
import { RandomTags } from "@/components/ui/random-tags"

const mockLinks = [
  {
    id: "1",
    title: "百度",
    url: "https://www.baidu.com",
    description: "中国最大的搜索引擎",
    tags: ["搜索", "工具"],
    order: 0,
    isActive: true,
    clickCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    title: "GitHub",
    url: "https://github.com",
    description: "全球最大代码托管平台",
    tags: ["开发", "代码"],
    order: 0,
    isActive: true,
    clickCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    title: "知乎",
    url: "https://www.zhihu.com",
    description: "中文互联网高质量问答社区",
    tags: ["问答", "社区"],
    order: 0,
    isActive: true,
    clickCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "4",
    title: "掘金",
    url: "https://juejin.cn",
    description: "开发者成长社区",
    tags: ["开发", "学习"],
    order: 0,
    isActive: true,
    clickCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "5",
    title: "Bilibili",
    url: "https://www.bilibili.com",
    description: "年轻人的视频网站",
    tags: ["视频", "娱乐"],
    order: 0,
    isActive: true,
    clickCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function Home() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState(mockLinks)
  const [form, setForm] = useState({ title: "", url: "", description: "", tags: "" })
  const [tagSeed, setTagSeed] = useState(0) // 用于触发标签重新随机

  const filteredLinks = links.filter(link =>
    link.title.includes(search) || link.url.includes(search) || (link.description?.includes(search)) || (link.tags?.some(tag => tag.includes(search)))
  )

  const handleAdd = () => {
    if (!form.title || !form.url) return
    const tags = form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    const newLink = {
      id: Date.now().toString(),
      title: form.title,
      url: form.url,
      description: form.description,
      tags,
      order: 0,
      isActive: true,
      clickCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setLinks([newLink, ...links])
    setForm({ title: "", url: "", description: "", tags: "" })
    setOpen(false)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleTagClick = (tag: string) => {
    setSearch(tag)
  }

  const handleRefreshTags = () => {
    setTagSeed(prev => prev + 1)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl flex flex-col items-center mb-8">
        {/* 随机标签 */}
        <RandomTags
          links={links}
          onTagClick={handleTagClick}
          onRefresh={handleRefreshTags}
          tagSeed={tagSeed}
        />
        
        <div className="flex w-full max-w-md gap-3 mb-8">
          <Input
            placeholder="搜索网址..."
            value={search}
            onChange={handleInputChange}
            className="flex-1 bg-white shadow-sm rounded-full px-5 py-2 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-6 text-base font-semibold shadow-md" size="lg">+</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm w-full">
              <DialogHeader>
                <DialogTitle>添加网址</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="标题"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
                <Input
                  placeholder="网址（https://...）"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                />
                <Input
                  placeholder="描述（可选）"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
                <Input
                  placeholder="标签（用逗号分隔，如：搜索,工具）"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                />
                <Button className="w-full mt-2" onClick={handleAdd} size="lg">保存</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredLinks.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-20 text-lg bg-white rounded-xl shadow-sm">暂无收藏网址</div>
        )}
        {filteredLinks.map(link => (
          <LinkCard
            key={link.id}
            {...link}
            onTagClick={handleTagClick}
          />
        ))}
      </div>
    </main>
  )
}