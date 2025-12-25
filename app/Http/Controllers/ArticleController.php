<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    //Give me all articles from the database.
    public function index()
    {
        return Article::all();
    }
}
