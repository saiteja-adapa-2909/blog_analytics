const express = require("express");
const app = express();
const axios = require("axios");
const lodash = require("lodash");
const path = require("path");
const { log } = require("console");


async function fetchBlogData(request, response, next) {
    try {
      const result = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
        headers: {
          'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
        },
      });
    request.blogData = result.data;
    request.blogDataLen = lodash.size(result.data.blogs);
    request.longestTitleBlog = lodash.maxBy(result.data.blogs, blog => blog.title.length);
    request.blogsWithPrivacy = lodash.filter(result.data.blogs, blog => lodash.includes(blog.title.toLowerCase(), 'privacy'));
    request.uniqueBlogTitles = lodash.uniqBy(result.data.blogs, 'title').map(blog => blog.title);

    // console.log(request);
      next();
    } catch (error) {
      console.error('Error fetching blog data:', error);
      response.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
// module.exports = fetchBlogData;

const memoizedBlogAnalytics = lodash.memoize((blogData, blogDataLen, longestTitleBlog, blogsWithPrivacy, uniqueBlogTitles) => {
  return {
    "Total number of blogs fetched": blogDataLen,
    "Longest Title Blog's title": longestTitleBlog['title'],
    "Count of blogs with Privacy": blogsWithPrivacy.length,
    "Unique Blog titles": uniqueBlogTitles
  };
});

const memoizedSearch = lodash.memoize((lowerCaseQuery, blogData) => {
  return lodash.filter(blogData.blogs, (blog) =>
    blog.title.toLowerCase().includes(lowerCaseQuery)
  );
});

app.get("/api/blog-stats", fetchBlogData, (request,response)=>{
  try{
    const blogData = request.blogData;
    const blogDataLength  = request.blogDataLen;
    const longestTitleBlog = request.longestTitleBlog;
    const blogsWithPrivacy = request.blogsWithPrivacy;
    const uniqueBlogTitles = request.uniqueBlogTitles;
    // response.json(blogData);  //i've kept this so that you can use this statement to view all the blogs available in the api you provided.

    const blogStats = memoizedBlogAnalytics(blogData,blogDataLength,longestTitleBlog,blogsWithPrivacy,uniqueBlogTitles);
    response.json(blogStats);
  }catch(e){
    response.status(500).json({ error: 'Internal Server Error' });
    console.error('Error analysing the blog data:', e);

  }  
  });

app.get("/api/blog-search", fetchBlogData, (request,response)=>{
  try{
    const userQuery = request.query.query;
    const lowerCaseQuery = userQuery.toLowerCase();
    const blogData = request.blogData;
    // const searchResults = (lodash.filter(blogData.blogs, (blog) =>
    //   blog.title.toLowerCase().includes(lowerCaseQuery)
    // ));     //This commented piece of code is getting results based on query parameter without using memoize fn..
    const searchResults = memoizedSearch(lowerCaseQuery,blogData);
  response.json(searchResults);
  console.log(searchResults);
  } catch(e){
    response.status(500).json({ error: 'Internal Server Error' });
    console.error('Error analysing the blog data involving query parameters:', e);
  }
    
});


app.listen(3000);
// module.exports(app);