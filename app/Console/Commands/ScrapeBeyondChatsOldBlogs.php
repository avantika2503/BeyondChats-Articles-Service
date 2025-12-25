<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Article;

class ScrapeBeyondChatsOldBlogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:scrape-beyond-chats-old-blogs';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Step 1: find last page
        $home = Http::withoutVerifying()->get('https://beyondchats.com/blogs/');
        $homeCrawler = new Crawler($home->body());

        $pageNumbers = [];

        $homeCrawler->filter('a')->each(function ($node) use (&$pageNumbers) {
            $href = $node->attr('href');
            if ($href && str_contains($href, '/blogs/page/')) {
                preg_match('/page\/(\d+)/', $href, $matches);
                if (isset($matches[1])) {
                    $pageNumbers[] = (int) $matches[1];
                }
            }
        });

        $lastPage = max($pageNumbers);

        // Step 2: collect oldest articles
        $collected = [];

        for ($page = $lastPage; $page >= 1 && count($collected) < 5; $page--) {
            $url = "https://beyondchats.com/blogs/page/{$page}/";
            $response = Http::withoutVerifying()->get($url);
            $crawler = new Crawler($response->body());

            $links = $crawler->filter('article h2 a')->each(function ($node) {
                $href = $node->attr('href');
                if (!$href)
                    return null;

                if (str_starts_with($href, '/')) {
                    return 'https://beyondchats.com' . $href;
                }

                return $href;
            });
            $links = array_reverse($links);


            foreach ($links as $link) {
                if (!in_array($link, $collected)) {
                    $collected[] = $link;
                }

                if (count($collected) === 5) {
                    break 2;
                }
            }
        }

        // loop over collected article URLs
        foreach ($collected as $articleUrl) {

            $response = Http::withoutVerifying()->get($articleUrl);
            $crawler = new Crawler($response->body());

            // extract title
            $title = $crawler->filter('h1')->first()->text();

            // extract full content
            $contentNodes = $crawler
                ->filter('.post-content')
                ->first()
                ->filter('p, h2, h3, ul, ol')
                ->each(function ($node) {
                    return trim($node->text());
                });

            $finalContent = implode("\n\n", array_filter($contentNodes));

            // store in DB
            Article::updateOrCreate(
                ['source_url' => $articleUrl],
                [
                    'title' => $title,
                    'content' => $finalContent,
                    'is_generated' => false,
                ]
            );
        }
        dd('Saved 5 oldest articles successfully');
    }
}