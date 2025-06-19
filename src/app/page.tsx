"use client"

import { useState, ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const mockLinks = [
  {
    id: "1",
    title: "百度",
    url: "https://www.baidu.com",
    description: "中国最大的搜索引擎"
  },
  {
    id: "2",
    title: "GitHub",
    url: "https://github.com",
    description: "全球最大代码托管平台"
  },
  {
    id: "3",
    title: "知乎",
    url: "https://www.zhihu.com",
    description: "中文互联网高质量问答社区"
  },
  {
    id: "4",
    title: "掘金",
    url: "https://juejin.cn",
    description: "开发者成长社区"
  },
  {
    id: "5",
    title: "Bilibili",
    url: "https://www.bilibili.com",
    description: "年轻人的视频网站"
  }
]

export default function Home() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState(mockLinks)
  const [form, setForm] = useState({ title: "", url: "", description: "" })

  const filteredLinks = links.filter(link =>
    link.title.includes(search) || link.url.includes(search) || (link.description?.includes(search))
  )

  const handleAdd = () => {
    if (!form.title || !form.url) return
    setLinks([
      { ...form, id: Date.now().toString() },
      ...links
    ])
    setForm({ title: "", url: "", description: "" })
    setOpen(false)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl flex flex-col items-center mb-8">
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
                <Button className="w-full mt-2" onClick={handleAdd} size="lg">保存</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="w-full max-w-5xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredLinks.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-20 text-lg bg-white rounded-xl shadow-sm">暂无收藏网址</div>
        )}
        {filteredLinks.map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-4 h-32 cursor-pointer border border-transparent hover:border-blue-200"
            title={link.title}
          >
            <img
              src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link.url)}`}
              alt={link.title}
              className="w-10 h-10 mb-2 rounded"
              loading="lazy"
            />
            <span className="text-sm text-gray-800 truncate w-full text-center font-medium group-hover:text-blue-600">{link.title}</span>
          </a>
        ))}
      </div>
    </main>
  )
}