"use client"
import axios from "axios";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Collapse, CollapseProps, Input } from "antd";
import { GitHubData, GitHubRepoOwner, GitHubRepository } from "./types/github.type";
import { GiRoundStar } from "react-icons/gi";

export default function Home() {
  const [username, setUsername] = useState<string>("")
  const [value] = useDebounce(username, 1000);
  const [data, setData] = useState<GitHubData[]>([])

  const fetchAPI = async () => {
    if (!username) {
      setData([]);
      return;
    }

    await axios.get(`https://api.github.com/search/users?q=${username}&per_page=5`)
      .then(async (results) => {
        const users = results.data.items;

        const userRepoData = await Promise.all(
          users.map(async (user: GitHubRepoOwner) => {
            try {
              const repoRes = await axios.get(`https://api.github.com/users/${user.login}/repos?per_page=3`);
              return {
                user,
                repos: repoRes.data
              };
            } catch (err) {
              console.error(`Error fetching repos for ${user.login}`, err);
              return {
                user,
                repos: []
              };
            }
          })
        );

        setData(userRepoData);
      })
      .catch(() => {
        setData([])
      })
  }

  useEffect(() => {
    fetchAPI()
  }, [value])

  const items: CollapseProps['items'] = data.map((i: GitHubData, idx: number) => {
    return {
      key: idx + 1,
      label: i.user.login,
      children: 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {
            i.repos.length !== 0
              ? i.repos.map((r: GitHubRepository, ridx: number) => {
                  return (
                    <div key={ridx} className="px-4 py-2 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="block text-lg font-bold">{ r.name }</span>
                          <span className="block truncate lg:max-w-60">{ r.description ?? "No description" }</span>
                        </div>
                        <div className="flex items-center space-x-1 min-w-8 text-end">
                          <span className="block">{ r.stargazers_count ?? 0 }</span>
                          <GiRoundStar className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  )
                })
              : <span>No Repository</span>
          }
        </div>,
    }
  })

  return (
    <main className="container mx-auto px-4 py-2 2xl:px-20 2xl:py-10">
      <div className="space-y-2">
        <h1 className="font-bold text-xl">GitHub User and Repository</h1>
        <Input
          size="large"
          placeholder="Search username"
          allowClear
          value={username}
          onChange={(e) => {
            if (e === undefined) {
              setUsername("")
            } else {
              setUsername(e.target.value)
            }
          }}
        />
      </div>

      <div className="mt-2 mb-6 text-gray-500 flex justify-between items-center">
        <span className="block">Total <span className="font-bold text-black">{ data?.length }</span> items</span>
        {
          value !== "" && <span className="block">Showing users for <span className="font-bold text-black">{ value }</span></span>
        }
      </div>

      <div>
        {
          data.length !== 0
          ? <Collapse
              items={items}
              defaultActiveKey={['1']}
            />
          : <span>No Items</span>
        }
      </div>
    </main>
  );
}
