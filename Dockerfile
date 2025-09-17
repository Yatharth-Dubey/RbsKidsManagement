# PHP + Apache image use karo
FROM php:8.2-apache

# Enable Apache rewrite module
RUN a2enmod rewrite

# Copy project files into Apache root
COPY . /var/www/html/

# Set working directory
WORKDIR /var/www/html/

# Apache ko foreground mode me chalao
CMD ["apache2-foreground"]
