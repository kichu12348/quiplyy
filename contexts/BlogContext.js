import { useState, useContext, createContext, useMemo } from "react";

const BlogContext = createContext(null);

const BlogProvider = ({ children }) => {
  const [currentBlog, setCurrentBlog] = useState(null);

  const value = useMemo(() => {
    return {
      currentBlog,
      setCurrentBlog,
    };
  }, [currentBlog]);

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};

const useBlog = () => {
  const context = useContext(BlogContext);
  return context;
};

export { BlogProvider, useBlog };
