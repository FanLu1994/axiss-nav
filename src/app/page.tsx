"use client"

import { useState, ChangeEvent, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LinkCard } from "@/components/ui/link-card"
import { RandomTags } from "@/components/ui/random-tags"
import { Particles } from "@/components/ui/particles"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export default function Home() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState<any[]>([])
  const [form, setForm] = useState({ title: "", url: "", description: "", tags: "" })
  const [tagSeed, setTagSeed] = useState(0)
  const [loading, setLoading] = useState(false)

  // TODO: 替换为你的 token 获取方式
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''

  // 加载数据
  const fetchLinks = async () => {
    setLoading(true)
    const res = await fetch("/api/links", {
      headers: { "authorization": `Bearer ${token}` }
    })
    const data = await res.json()
    if (Array.isArray(data)) {
      setLinks(data)
    } else {
      setLinks([])
      toast.error(data.error || '获取数据失败')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLinks()
    // eslint-disable-next-line
  }, [])

  const filteredLinks = links.filter(link =>
    link.title.includes(search) || link.url.includes(search) || (link.description?.includes(search)) || (link.tags?.some((tag: any) => tag.name?.includes(search) || tag.includes?.(search)))
  )

  // 添加新链接
  const handleAdd = async () => {
    if (!form.title || !form.url) {
      toast.error("标题和网址不能为空")
      return
    }
    const tags = form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    await fetch("/api/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        title: form.title,
        url: form.url,
        description: form.description,
        tags
      })
    })
    setForm({ title: "", url: "", description: "", tags: "" })
    setOpen(false)
    fetchLinks()
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
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12 relative">
      <Particles />
      <div className="w-full max-w-2xl flex flex-col items-center mb-8 relative z-10">
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
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
        {filteredLinks.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-20 text-lg bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
            暂无收藏网址
          </div>
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