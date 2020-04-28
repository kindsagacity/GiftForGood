import { Logger } from '@nestjs/common';
import { URL } from 'url';
/**
 * Check if the domain allowed or not
 * This function is simplified and since we have a determined list of domains there is no need to use PSL
 * and all we need to do is keep the domain using one dot as delimiter
 * @param url Url string to find
 * @param whitelist List of allowed domains
 */
export const IsDomainInList = (urlString: string, whitelist: string[]) => {
  try {
    const url = new URL(urlString);
    let hostname = url.hostname
      .split('.')
      .slice(-2)
      .join('.'); // Get only top level domain

    if(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(url.hostname))
	hostname = url.hostname;

    return whitelist.includes(hostname);
  } catch (error) {
    Logger.warn(`Unable to parse domain ${urlString}: ${error}`);
    return false;
  }
};
